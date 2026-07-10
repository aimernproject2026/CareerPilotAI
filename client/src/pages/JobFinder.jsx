import React, { useState } from 'react'
import { motion } from "motion/react"
import { FaFileUpload, FaSearch, FaBriefcase } from "react-icons/fa"
import { BsBuilding } from "react-icons/bs"
import axios from 'axios'
import { ServerUrl } from '../App'

function JobFinder() {
    const [resumeFile, setResumeFile] = useState(null)
    const [workType, setWorkType] = useState("remote")
    const [jobType, setJobType] = useState("fulltime")
    const [targetCompany, setTargetCompany] = useState("")
    const [loading, setLoading] = useState(false)
    const [experience, setExperience] = useState("")
    const [results, setResults] = useState(null)

    const handleFindJobs = async () => {
        setLoading(true)
        try {
            const formData = new FormData()
            if (resumeFile) formData.append("resume", resumeFile)
            formData.append("workType", workType)
            formData.append("jobType", jobType)
            formData.append("targetCompany", targetCompany)
            formData.append("experience", experience)
            const result = await axios.post(ServerUrl + "/api/job/find", formData, { withCredentials: true })
            setResults(result.data)
        } catch (error) {
            console.log(error)
            alert(error.response?.data?.message || "Something went wrong!")
        }
        setLoading(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='min-h-screen bg-linear-to-br from-gray-100 to-gray-200 px-4 py-12'>
            <div className='max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-10'>
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>Job Finder</h1>
                <p className='text-gray-500 mb-8'>Upload your resume and we'll find the best matching jobs for you!</p>
                <div className='space-y-5'>
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        onClick={() => document.getElementById("resumeUploadJob").click()}
                        className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition'>
                        <FaFileUpload className='text-3xl mx-auto text-green-600 mb-2' />
                        <input
                            type="file"
                            accept="application/pdf"
                            id="resumeUploadJob"
                            className='hidden'
                            onChange={(e) => setResumeFile(e.target.files[0])} />
                        <p className='text-gray-600 font-medium'>
                            {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                        </p>
                    </motion.div>
                    <div className='relative'>
                        <BsBuilding className='absolute top-4 left-4 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Target Company (Optional — e.g. Google, Amazon)'
                            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                            onChange={(e) => setTargetCompany(e.target.value)}
                            value={targetCompany} />
                    </div>

                    {/* Experience */}
                    <div className='relative'>
                        <FaBriefcase className='absolute top-4 left-4 text-gray-400' />
                        <input
                            type='number'
                            placeholder='Years of Experience (e.g. 2)'
                            min={0}
                            max={50}
                            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                            onChange={(e) => setExperience(e.target.value)}
                            value={experience} />
                    </div>

                    <div>
                        <p className='text-sm text-gray-600 font-medium mb-2'>Work Type:</p>
                        <div className='flex gap-3'>
                            {["remote", "onsite", "both"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setWorkType(type)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition capitalize ${workType === type ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className='text-sm text-gray-600 font-medium mb-2'>Job Type:</p>
                        <div className='flex gap-3'>
                            {["fulltime", "parttime"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setJobType(type)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition ${jobType === type ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                                    {type === "fulltime" ? "Full Time" : "Part Time"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <motion.button
                        onClick={handleFindJobs}
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-full text-lg font-semibold transition shadow-md'>
                        {loading ? "Finding Jobs..." : "Find Jobs"}
                    </motion.button>
                </div>
                {results && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-10 space-y-4'>
                        <div className='bg-green-50 border border-green-200 rounded-xl p-4 mb-6'>
                            <p className='text-green-700 font-medium'>
                                Found matches for <span className='font-bold'>{results.role}</span> — <span className='font-bold'>{results.level}</span> ({results.experience})
                            </p>
                        </div>
                        {results.jobSuggestions.map((job, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className='flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 hover:shadow-md transition'>
                                <div className='flex items-center gap-3'>
                                    <div className='bg-green-100 text-green-600 w-10 h-10 rounded-full flex items-center justify-center font-bold'>
                                        {index + 1}
                                    </div>
                                    <p className='font-medium text-gray-800'>{job.title}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a href={job.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-full text-sm hover:opacity-80 transition">
                                        LinkedIn
                                    </a>
                                    <a href={job.naukriUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-full text-sm hover:opacity-80 transition">
                                        Naukri
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

export default JobFinder
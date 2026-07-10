import React, { useState } from 'react'
import { motion } from "motion/react"
import { FaFileUpload, FaUser, FaBriefcase, FaCopy, FaCheck } from "react-icons/fa"
import { BsBuilding } from "react-icons/bs"
import axios from 'axios'
import { ServerUrl } from '../App'

function CoverLetter() {
    const [resumeFile, setResumeFile] = useState(null)
    const [fullName, setFullName] = useState("")
    const [jobRole, setJobRole] = useState("")
    const [companyName, setCompanyName] = useState("")
    const [jobDescription, setJobDescription] = useState("")
    const [loading, setLoading] = useState(false)
    const [coverLetter, setCoverLetter] = useState("")
    const [copied, setCopied] = useState(false)

    const handleGenerate = async () => {
        if (!fullName || !jobRole || !companyName) {
            alert("Please fill Full Name, Job Role and Company Name!")
            return
        }
        setLoading(true)
        try {
            const formData = new FormData()
            if (resumeFile) formData.append("resume", resumeFile)
            formData.append("fullName", fullName)
            formData.append("jobRole", jobRole)
            formData.append("companyName", companyName)
            formData.append("jobDescription", jobDescription)

            const result = await axios.post(ServerUrl + "/api/cover-letter/generate", formData, { withCredentials: true })
            setCoverLetter(result.data.coverLetter)
        } catch (error) {
            console.log(error)
            alert(error.response?.data?.message || "Something went wrong!")
        }
        setLoading(false)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='min-h-screen bg-linear-to-br from-gray-100 to-gray-200 px-4 py-12'>
            <div className='max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-10'>
                <h1 className='text-3xl font-bold text-gray-800 mb-2'>Cover Letter Generator</h1>
                <p className='text-gray-500 mb-8'>Fill in your details and get a professional cover letter instantly!</p>

                <div className='space-y-5'>
                    {/* Full Name */}
                    <div className='relative'>
                        <FaUser className='absolute top-4 left-4 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Full Name'
                            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                            onChange={(e) => setFullName(e.target.value)}
                            value={fullName} />
                    </div>

                    {/* Job Role */}
                    <div className='relative'>
                        <FaBriefcase className='absolute top-4 left-4 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Job Role (e.g. Frontend Developer)'
                            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                            onChange={(e) => setJobRole(e.target.value)}
                            value={jobRole} />
                    </div>

                    {/* Company Name */}
                    <div className='relative'>
                        <BsBuilding className='absolute top-4 left-4 text-gray-400' />
                        <input
                            type='text'
                            placeholder='Company Name (e.g. Google)'
                            className='w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition'
                            onChange={(e) => setCompanyName(e.target.value)}
                            value={companyName} />
                    </div>

                    {/* Job Description */}
                    <textarea
                        placeholder='Paste Job Description here (Optional but recommended)'
                        rows={4}
                        className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition resize-none'
                        onChange={(e) => setJobDescription(e.target.value)}
                        value={jobDescription} />

                    {/* Resume Upload */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        onClick={() => document.getElementById("resumeUploadCL").click()}
                        className='border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition'>
                        <FaFileUpload className='text-3xl mx-auto text-green-600 mb-2' />
                        <input
                            type="file"
                            accept="application/pdf"
                            id="resumeUploadCL"
                            className='hidden'
                            onChange={(e) => setResumeFile(e.target.files[0])} />
                        <p className='text-gray-600 font-medium'>
                            {resumeFile ? resumeFile.name : "Click to upload resume (Optional)"}
                        </p>
                    </motion.div>

                    {/* Generate Button */}
                    <motion.button
                        onClick={handleGenerate}
                        disabled={loading}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-full text-lg font-semibold transition shadow-md'>
                        {loading ? "Generating..." : "Generate Cover Letter"}
                    </motion.button>
                </div>

                {/* Cover Letter Output */}
                {coverLetter && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='mt-10'>
                        <div className='flex items-center justify-between mb-4'>
                            <h2 className='text-xl font-bold text-gray-800'>Your Cover Letter</h2>
                            <motion.button
                                onClick={handleCopy}
                                whileTap={{ scale: 0.95 }}
                                className='flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-sm hover:opacity-80 transition'>
                                {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                {copied ? "Copied!" : "Copy"}
                            </motion.button>
                        </div>
                        <div className='bg-gray-50 border border-gray-200 rounded-2xl p-6 whitespace-pre-wrap text-gray-700 leading-relaxed text-sm'>
                            {coverLetter}
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

export default CoverLetter
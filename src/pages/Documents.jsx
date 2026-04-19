import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDocuments } from '../services/tenantService'
import { FileText, Image, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Documents() {
  const { tenant } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (tenant?.id) {
      getDocuments(tenant.id).then(data => {
        setDocuments(data)
        setLoading(false)
      })
    }
  }, [tenant])

  const getFileIcon = (type) => {
    if (type === 'PDF') return <FileText size={22} className="text-red-400" />
    return <Image size={22} className="text-blue-400" />
  }

  const getFileColor = (type) => {
    if (type === 'PDF') return 'bg-red-500/10 border-red-500/20'
    return 'bg-blue-500/10 border-blue-500/20'
  }

  const handleDownload = (doc) => {
    // Real URL hai toh open karo
    if (doc.url && doc.url !== '') {
      window.open(doc.url, '_blank')
    } else {
      toast.error('Document URL not available. Contact office.')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-blue-400 animate-pulse">Loading documents...</div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black text-white">Documents</h1>
        <p className="text-gray-500 text-sm mt-1">Your uploaded documents and agreements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4 col-span-2">
          <div className="text-3xl font-black text-white font-display">{documents.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Documents</div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <div className="text-3xl font-black text-red-400 font-display">
            {documents.filter(d => d.type === 'PDF').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">PDF Files</div>
        </div>
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-4">
          <div className="text-3xl font-black text-blue-400 font-display">
            {documents.filter(d => d.type === 'Image').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Images</div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-[#1a1d27] border border-[#2a2d3a] rounded-2xl p-5 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${getFileColor(doc.type)}`}>
                {getFileIcon(doc.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{doc.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {doc.type} • {doc.size}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Uploaded: {doc.uploaded_at?.split('T')[0]}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-[#0f1117] border border-[#2a2d3a] text-gray-400 hover:text-white hover:border-blue-500 text-xs font-medium transition"
              >
                <Eye size={13} />
                View
              </a>
              <button
                onClick={() => handleDownload(doc)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
              >
                <Download size={13} />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getDocumentsByEntity,
  createDocumentLinkRecord,
  uploadDocument,
  deleteDocumentLink,
  getDocumentDownloadUrl,
  detectUrlProvider,
  getFileTypeInfo,
  formatFileSize,
} from '@/lib/documents'
import { logActivity } from '@/lib/queries'
import type { DocumentLink } from '@/lib/types'
import {
  FileText,
  Link as LinkIcon,
  Upload,
  Trash2,
  Download,
  ExternalLink,
  Plus,
  File,
  Image,
  Table,
  Presentation,
  Paperclip,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface DocumentManagerProps {
  entityType: 'contact' | 'deal'
  entityId: string
  userId?: string
}

function FileTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'pdf': return <FileText className="h-4 w-4" />
    case 'word': return <FileText className="h-4 w-4" />
    case 'excel': return <Table className="h-4 w-4" />
    case 'csv': return <Table className="h-4 w-4" />
    case 'ppt': return <Presentation className="h-4 w-4" />
    case 'image': return <Image className="h-4 w-4" />
    default: return <File className="h-4 w-4" />
  }
}

export function DocumentManager({ entityType, entityId, userId }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<DocumentLink[]>([])
  const [mode, setMode] = useState<'upload' | 'link'>('upload')
  const [showAdd, setShowAdd] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<DocumentLink | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(() => {
    getDocumentsByEntity(entityType, entityId).then(setDocuments)
  }, [entityType, entityId])

  useEffect(() => { loadDocs() }, [loadDocs])

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const result = await uploadDocument({
        entity_type: entityType,
        entity_id: entityId,
        file,
        created_by: userId || '',
      })
      if (result) {
        await logActivity({
          entity_type: entityType,
          entity_id: entityId,
          action: 'note',
          description: `Uploaded document: ${file.name}`,
          created_by: userId,
        })
      }
    }
    setUploading(false)
    setShowAdd(false)
    loadDocs()
  }

  const handleAddLink = async () => {
    if (!linkUrl.trim() || !linkTitle.trim()) return
    await createDocumentLinkRecord({
      entity_type: entityType,
      entity_id: entityId,
      url: linkUrl,
      title: linkTitle,
      link_type: 'url',
      created_by: userId || '',
    })
    await logActivity({
      entity_type: entityType,
      entity_id: entityId,
      action: 'note',
      description: `Attached link: ${linkTitle}`,
      created_by: userId,
    })
    setLinkUrl('')
    setLinkTitle('')
    setShowAdd(false)
    loadDocs()
  }

  const handleDelete = async (doc: DocumentLink) => {
    await deleteDocumentLink(doc.id, doc.file_path)
    setConfirmDelete(null)
    loadDocs()
  }

  const handleDownload = async (doc: DocumentLink) => {
    if (doc.link_type === 'file' && doc.file_path) {
      const url = await getDocumentDownloadUrl(doc.file_path)
      if (url) window.open(url, '_blank')
    } else if (doc.url) {
      window.open(doc.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const urlProvider = linkUrl ? detectUrlProvider(linkUrl) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-cc-text-primary flex items-center gap-1">
          <Paperclip className="h-3 w-3" /> Documents
          {documents.length > 0 && (
            <span className="text-cc-text-muted ml-1">({documents.length})</span>
          )}
        </h4>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setShowAdd(!showAdd)}
          className="h-6 px-2"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Add section */}
      {showAdd && (
        <div className="mb-3 p-3 bg-cc-surface-2 border border-cc-border rounded-lg">
          <div className="flex gap-1 mb-3">
            <button
              onClick={() => setMode('upload')}
              className={`px-2.5 py-1 text-[11px] border transition-colors rounded-md ${
                mode === 'upload'
                  ? 'border-cc-btn-border text-cc-text-primary'
                  : 'border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary'
              }`}
            >
              <Upload className="h-3 w-3 inline mr-1" />
              Upload File
            </button>
            <button
              onClick={() => setMode('link')}
              className={`px-2.5 py-1 text-[11px] border transition-colors rounded-md ${
                mode === 'link'
                  ? 'border-cc-btn-border text-cc-text-primary'
                  : 'border-cc-border-hover text-cc-text-secondary hover:text-cc-text-primary'
              }`}
            >
              <LinkIcon className="h-3 w-3 inline mr-1" />
              Add Link
            </button>
          </div>

          {mode === 'upload' ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-cc-text-primary bg-cc-surface'
                  : 'border-cc-border hover:border-cc-border-hover'
              }`}
            >
              <Upload className="h-5 w-5 mx-auto mb-2 text-cc-text-muted" />
              <p className="text-xs text-cc-text-secondary">
                {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={e => handleFileUpload(e.target.files)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Document title"
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
                className="h-7 text-xs"
              />
              <div className="relative">
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="h-7 text-xs"
                />
                {urlProvider && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-cc-text-muted border border-cc-border px-1.5 py-0.5 rounded">
                    {urlProvider}
                  </span>
                )}
              </div>
              <Button size="xs" onClick={handleAddLink} disabled={!linkUrl.trim() || !linkTitle.trim()}>
                Add Link
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Document list */}
      {documents.length === 0 && !showAdd ? (
        <p className="text-[11px] text-cc-text-muted">No documents attached</p>
      ) : (
        <div className="space-y-1">
          {documents.map(doc => {
            const isFile = doc.link_type === 'file'
            const fileInfo = isFile ? getFileTypeInfo(doc.mime_type, doc.title) : null
            const provider = !isFile && doc.url ? detectUrlProvider(doc.url) : null

            return (
              <div
                key={doc.id}
                className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-cc-surface-2 group transition-colors"
              >
                <div className="text-cc-text-muted flex-shrink-0">
                  {isFile && fileInfo ? (
                    <FileTypeIcon type={fileInfo.icon} />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="text-xs text-cc-text-primary hover:underline truncate block text-left w-full"
                  >
                    {doc.title}
                  </button>
                  <div className="flex items-center gap-2 text-[10px] text-cc-text-muted">
                    {isFile && fileInfo && (
                      <span className="border border-cc-border px-1 py-px rounded text-[9px] uppercase">
                        {fileInfo.label}
                      </span>
                    )}
                    {isFile && doc.file_size && (
                      <span>{formatFileSize(doc.file_size)}</span>
                    )}
                    {provider && (
                      <span className="border border-cc-border px-1 py-px rounded text-[9px]">
                        {provider}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="text-cc-text-muted hover:text-cc-text-primary p-0.5"
                    title={isFile ? 'Download' : 'Open'}
                  >
                    {isFile ? <Download className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(doc)}
                    className="text-cc-text-muted hover:text-cc-text-primary p-0.5"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{confirmDelete?.title}&quot;?
              {confirmDelete?.link_type === 'file' && ' The file will also be deleted from storage.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

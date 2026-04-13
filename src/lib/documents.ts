import { createClient } from './supabase'
import type { DocumentLink } from './types'

function getClient() { return createClient() }

export async function getDocumentsByEntity(entityType: string, entityId: string): Promise<DocumentLink[]> {
  const { data } = await getClient()
    .from('document_links')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createDocumentLinkRecord(link: {
  entity_type: 'contact' | 'deal'
  entity_id: string
  url: string
  title: string
  link_type: 'url' | 'file'
  file_path?: string | null
  file_size?: number | null
  mime_type?: string | null
  created_by: string
}): Promise<DocumentLink | null> {
  const { data } = await getClient()
    .from('document_links')
    .insert({
      entity_type: link.entity_type,
      entity_id: link.entity_id,
      url: link.url,
      title: link.title,
      link_type: link.link_type,
      file_path: link.file_path ?? null,
      file_size: link.file_size ?? null,
      mime_type: link.mime_type ?? null,
      created_by: link.created_by,
    })
    .select()
    .single()
  return data
}

export async function uploadDocument(input: {
  entity_type: 'contact' | 'deal'
  entity_id: string
  file: File
  created_by: string
}): Promise<DocumentLink | null> {
  const supabase = getClient()
  const filePath = `${input.entity_type}/${input.entity_id}/${Date.now()}_${input.file.name}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, input.file)

  if (uploadError) {
    console.error('Upload failed:', uploadError)
    return null
  }

  return createDocumentLinkRecord({
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    url: '',
    title: input.file.name,
    link_type: 'file',
    file_path: filePath,
    file_size: input.file.size,
    mime_type: input.file.type || null,
    created_by: input.created_by,
  })
}

export async function getDocumentDownloadUrl(filePath: string): Promise<string | null> {
  const { data } = await getClient().storage
    .from('documents')
    .createSignedUrl(filePath, 3600) // 1 hour
  return data?.signedUrl ?? null
}

export async function deleteDocumentLink(id: string, filePath?: string | null): Promise<void> {
  if (filePath) {
    await getClient().storage.from('documents').remove([filePath])
  }
  await getClient().from('document_links').delete().eq('id', id)
}

export async function getDocumentCounts(
  entityType: string,
  entityIds: string[]
): Promise<Record<string, number>> {
  if (entityIds.length === 0) return {}
  const { data } = await getClient()
    .from('document_links')
    .select('entity_id')
    .eq('entity_type', entityType)
    .in('entity_id', entityIds)
  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.entity_id] = (counts[row.entity_id] || 0) + 1
  }
  return counts
}

export function detectUrlProvider(url: string): string | null {
  if (/drive\.google\.com|docs\.google\.com/i.test(url)) return 'Google Drive'
  if (/dropbox\.com/i.test(url)) return 'Dropbox'
  if (/onedrive\.live\.com|sharepoint\.com/i.test(url)) return 'OneDrive'
  if (/notion\.so|notion\.site/i.test(url)) return 'Notion'
  return null
}

export function getFileTypeInfo(mimeType: string | null, fileName: string): { label: string; icon: string } {
  if (mimeType) {
    if (mimeType === 'application/pdf') return { label: 'PDF', icon: 'pdf' }
    if (mimeType.includes('word') || mimeType.includes('document')) return { label: 'Word', icon: 'word' }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return { label: 'Excel', icon: 'excel' }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { label: 'PPT', icon: 'ppt' }
    if (mimeType.startsWith('image/')) return { label: 'Image', icon: 'image' }
    if (mimeType === 'text/csv') return { label: 'CSV', icon: 'csv' }
  }
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return { label: 'PDF', icon: 'pdf' }
  if (['doc', 'docx'].includes(ext ?? '')) return { label: 'Word', icon: 'word' }
  if (['xls', 'xlsx'].includes(ext ?? '')) return { label: 'Excel', icon: 'excel' }
  if (['ppt', 'pptx'].includes(ext ?? '')) return { label: 'PPT', icon: 'ppt' }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext ?? '')) return { label: 'Image', icon: 'image' }
  if (ext === 'csv') return { label: 'CSV', icon: 'csv' }
  return { label: 'File', icon: 'file' }
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

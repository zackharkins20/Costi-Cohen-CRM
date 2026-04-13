'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'

/* Stage column top-border colors — blue-grey progressive tints */
const stageTopBorders: Record<string, string> = {
  active_leads: 'border-t-[3px] border-t-[#10B981]',
  proposal_sent: 'border-t-[3px] border-t-[#3B82F6]',
  agreement_sent: 'border-t-[3px] border-t-[#F59E0B]',
  agreement_signed: 'border-t-[3px] border-t-[#FB7185]',
  retainer_invoice_sent: 'border-t-[3px] border-t-[#8B5CF6]',
  property_search: 'border-t-[3px] border-t-[#06B6D4]',
  contracts_exchanged: 'border-t-[3px] border-t-[#F97316]',
  settled: 'border-t-[3px] border-t-[#059669]',
  marketing_only: 'border-t-[3px] border-t-[#9CA3AF]',
  /* task statuses */
  todo: 'border-t-[3px] border-t-[#8BA4B8]',
  in_progress: 'border-t-[3px] border-t-[#5A7A94]',
  review: 'border-t-[3px] border-t-[#3B5068]',
  done: 'border-t-[3px] border-t-[#5A8F6A]',
}

/* Card left-border accents by stage */
const stageLeftBorders: Record<string, string> = {
  active_leads: 'border-l-[3px] border-l-[#10B981]',
  proposal_sent: 'border-l-[3px] border-l-[#3B82F6]',
  agreement_sent: 'border-l-[3px] border-l-[#F59E0B]',
  agreement_signed: 'border-l-[3px] border-l-[#FB7185]',
  retainer_invoice_sent: 'border-l-[3px] border-l-[#8B5CF6]',
  property_search: 'border-l-[3px] border-l-[#06B6D4]',
  contracts_exchanged: 'border-l-[3px] border-l-[#F97316]',
  settled: 'border-l-[3px] border-l-[#059669]',
  marketing_only: 'border-l-[3px] border-l-[#9CA3AF]',
  todo: 'border-l-[3px] border-l-[#8BA4B8]',
  in_progress: 'border-l-[3px] border-l-[#5A7A94]',
  review: 'border-l-[3px] border-l-[#3B5068]',
  done: 'border-l-[3px] border-l-[#5A8F6A]',
}

interface KanbanColumn<T> {
  id: string
  title: string
  items: T[]
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[]
  onDragEnd: (result: DropResult) => void
  renderCard: (item: T, index: number) => React.ReactNode
  getItemId: (item: T) => string
  columnHeaderExtra?: (column: KanbanColumn<T>) => React.ReactNode
}

export function KanbanBoard<T>({ columns, onDragEnd, renderCard, getItemId, columnHeaderExtra }: KanbanBoardProps<T>) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className={cn(
              'flex items-center justify-between mb-3 pb-2 rounded-t-md',
              stageTopBorders[column.id] || '',
            )}>
              <div className="flex items-center gap-1.5 pt-2">
                {columnHeaderExtra && columnHeaderExtra(column)}
                <h3 className="text-[11px] font-medium text-cc-text-secondary uppercase tracking-[0.08em]">
                  {column.title}
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-cc-surface-2 border border-cc-border text-cc-text-muted rounded-sm mt-2">
                {column.items.length}
              </span>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[200px] p-2 transition-colors border border-transparent rounded-lg',
                    snapshot.isDraggingOver ? 'bg-cc-surface-2 border-cc-border' : 'bg-cc-surface/50'
                  )}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={getItemId(item)} draggableId={getItemId(item)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'mb-2 last:mb-0 transition-all group/card relative',
                            snapshot.isDragging && 'shadow-xl -translate-y-0.5',
                            stageLeftBorders[column.id] || '',
                            'rounded-lg',
                          )}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="absolute left-0 top-0 bottom-0 w-5 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                          >
                            <GripVertical className="h-3.5 w-3.5 text-cc-text-muted" />
                          </div>
                          {renderCard(item, index)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

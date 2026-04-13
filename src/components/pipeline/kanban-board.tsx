'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

/* Stage column top-border colors — subtle progressive tints */
const stageTopBorders: Record<string, string> = {
  lead: 'border-t-[3px] border-t-[#9BA3AF]',
  initial_call: 'border-t-[3px] border-t-[#7A828E]',
  property_search: 'border-t-[3px] border-t-[#4A5568]',
  due_diligence: 'border-t-[3px] border-t-[#333D4D]',
  exchange: 'border-t-[3px] border-t-[#1A1F36]',
  fees_collected: 'border-t-[3px] border-t-[#4A5D52]',
  /* task statuses */
  todo: 'border-t-[3px] border-t-[#9BA3AF]',
  in_progress: 'border-t-[3px] border-t-[#4A5568]',
  review: 'border-t-[3px] border-t-[#1A1F36]',
  done: 'border-t-[3px] border-t-[#4A5D52]',
}

/* Card left-border accents by stage */
const stageLeftBorders: Record<string, string> = {
  lead: 'border-l-[3px] border-l-[#9BA3AF]',
  initial_call: 'border-l-[3px] border-l-[#7A828E]',
  property_search: 'border-l-[3px] border-l-[#4A5568]',
  due_diligence: 'border-l-[3px] border-l-[#333D4D]',
  exchange: 'border-l-[3px] border-l-[#1A1F36]',
  fees_collected: 'border-l-[3px] border-l-[#4A5D52]',
  todo: 'border-l-[3px] border-l-[#9BA3AF]',
  in_progress: 'border-l-[3px] border-l-[#4A5568]',
  review: 'border-l-[3px] border-l-[#1A1F36]',
  done: 'border-l-[3px] border-l-[#4A5D52]',
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
                          {...provided.dragHandleProps}
                          className={cn(
                            'mb-2 last:mb-0 transition-all',
                            snapshot.isDragging && 'shadow-xl -translate-y-0.5',
                            stageLeftBorders[column.id] || '',
                            'rounded-lg',
                          )}
                        >
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

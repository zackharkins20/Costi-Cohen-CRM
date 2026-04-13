'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { cn } from '@/lib/utils'

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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {columnHeaderExtra && columnHeaderExtra(column)}
                <h3 className="text-[11px] font-medium text-cc-text-secondary uppercase tracking-[0.08em]">
                  {column.title}
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 bg-cc-surface-2 border border-cc-border text-cc-text-muted">
                {column.items.length}
              </span>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[200px] p-2 transition-colors border border-transparent',
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
                            'mb-2 last:mb-0 transition-shadow',
                            snapshot.isDragging && 'shadow-xl'
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

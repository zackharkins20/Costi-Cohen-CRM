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
}

export function KanbanBoard<T>({ columns, onDragEnd, renderCard, getItemId }: KanbanBoardProps<T>) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-[var(--cc-text-secondary)] uppercase tracking-wider">
                {column.title}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--cc-glass-bg)] text-[var(--cc-text-muted)]">
                {column.items.length}
              </span>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'min-h-[200px] rounded-lg p-2 transition-colors',
                    snapshot.isDraggingOver ? 'bg-[var(--cc-accent-soft)]' : 'bg-[var(--cc-glass-bg)]/50'
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

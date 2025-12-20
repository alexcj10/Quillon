import { Reorder, useDragControls } from 'framer-motion';
import { NodeItemCard } from './NodeItemCard';
import { NodeItem } from '../context/NodesContext';

interface DraggableNodeItemProps {
    node: NodeItem;
    toggleNode: (id: string) => void;
    deleteNode: (id: string) => void;
    togglePin: (id: string) => void;
}

export function DraggableNodeItem({ node, toggleNode, deleteNode, togglePin }: DraggableNodeItemProps) {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={node}
            dragListener={false} // Disable default drag on whole item so scrolling works
            dragControls={dragControls}
            className="relative select-none"
            style={{ touchAction: 'pan-y' }} // Force override Framer Motion's default touch-none
        >
            <NodeItemCard
                node={node}
                toggleNode={toggleNode}
                deleteNode={deleteNode}
                togglePin={togglePin}
                dragControls={dragControls}
            />
        </Reorder.Item>
    );
}

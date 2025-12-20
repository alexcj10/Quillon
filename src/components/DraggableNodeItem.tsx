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
            dragListener={false} // Important: Disable default drag on whole item
            dragControls={dragControls}
            className="relative touch-none" // touch-none might still be needed for the handle but not the whole item? Actually for scrolling we want auto. 
        // Reorder.Item usually adds touch-action: none. We might need to override.
        // But since dragListener is false, the element SHOULD allow scrolling.
        >
            <NodeItemCard
                node={node}
                toggleNode={toggleNode}
                deleteNode={deleteNode}
                togglePin={togglePin}
                dragControls={dragControls} // Pass controls to Card to attach to Grip
            />
        </Reorder.Item>
    );
}

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
            className="relative touch-pan-y select-none" // touch-pan-y allows vertical scrolling!
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

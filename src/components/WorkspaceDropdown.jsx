
import { useState } from 'react';
import { ChevronDown, ArrowLeft } from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion'
import {Button} from '@/components/ui/button'

export default function WorkspaceDropdown(){
const[open,setOpen]=useState(false);
return(
    <div className='relative inline-block text-left'>
{/*Dropdown Button*/}
<Button variant="outline" className="flex  items-center gap-2" onClick={()=>setOpen(!open)}>
Back to Workspace <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180":"rotate-180"}`}/>

</Button>
{/* Dropdown Menu*/}
<AnimatePresence>

{open && (
    <motion.div 
    initial={{opacity:0,scale:0.95, y:-10}}
    animate={{opacity:1,scale:1, y:0}}
    exit={{opacity:0,scale:0.95, y:-10}}
    transition={{duration:0.15}}
    className="absolute mt-2 w-56 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-10"
    >
        <div className="py-1">
            <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Workspaces</a>
        </div>
    </motion.div>
)}
</AnimatePresence>
    </div>
)}

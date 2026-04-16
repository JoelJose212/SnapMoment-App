import { motion } from 'framer-motion'
import MissionControl from '../../components/photographer/MissionControl'

export default function PhotographerDashboard() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <MissionControl />
    </motion.div>
  )
}

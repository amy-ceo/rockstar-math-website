import { motion } from "framer-motion";

const AnimatedSection = ({ children, direction = "left", delay = 0 }) => {
  const animations = {
    left: { initial: { opacity: 0, x: -100 }, animate: { opacity: 1, x: 0 } },
    right: { initial: { opacity: 0, x: 100 }, animate: { opacity: 1, x: 0 } },
    top: { initial: { opacity: 0, y: -100 }, animate: { opacity: 1, y: 0 } },
    bottom: { initial: { opacity: 0, y: 100 }, animate: { opacity: 1, y: 0 } },
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  };

  return (
    <div className="overflow-hidden"> {/* ✅ Fix applied here */}
      <motion.div
        initial={animations[direction].initial}
        whileInView={animations[direction].animate}
        transition={{ duration: 0.8, ease: "easeOut", delay }}
        viewport={{ once: true, amount: 0.3 }}
        className="w-full px-6 py-12"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default AnimatedSection;

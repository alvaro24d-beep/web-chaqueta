"use client";

import { motion, type Variants } from "framer-motion";

const WORD: Variants = {
  hidden: { opacity: 0.12, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

/** Texto que se "enciende" palabra a palabra al entrar en el viewport. */
export default function WordReveal({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{ show: { transition: { staggerChildren: 0.025 } } }}
    >
      {text.split(" ").map((word, i) => (
        <motion.span key={i} className="inline-block" variants={WORD}>
          {word}
          {" "}
        </motion.span>
      ))}
    </motion.span>
  );
}

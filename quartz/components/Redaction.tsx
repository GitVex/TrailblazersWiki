import { FunctionalComponent, h } from "preact"

interface Props {
  content: string;
}

const Redaction: FunctionalComponent<Props> = ({ content }) => {

  const show = true
  // generate a string of █s that replace letters but keep white spaces
  const redactedContent = content.replace(/[^ ]/g, "█")


  return (
    show ? <p>content</p> : <p>redactedContent</p>
  )
}

export default Redaction

import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import packageJson from '../../package.json' with { type: 'json' };

export default (() => {
  const VersionInfo: QuartzComponent = () => {

    return (
      <p>{packageJson.contentVersion}</p>
    )
  }
  return VersionInfo
}) satisfies QuartzComponentConstructor
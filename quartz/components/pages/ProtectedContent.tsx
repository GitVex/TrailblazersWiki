import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import ContentFactory from "./Content"
//@ts-ignore
import script from "../scripts/protectedContent.inline"


const ProtectedContent: QuartzComponent = (componentData: QuartzComponentProps) => {
  const Content = ContentFactory()
  const allowedUsers = componentData.fileData.frontmatter?.allowedUsers as string ?? "no one"

  return (<>
      <div class="protected-content">
        <div id="protected-content-unauthorized" style={{ display: "none" }}>
          <p>Oops, No peeking! Only {allowedUsers} can see this file. Go back to bed.</p>
        </div>
        <div id="protected-content-authorized" style={{ display: "none" }}>
          Only {allowedUsers} can see this file.
          {Content(componentData)}
        </div>
      </div>
      {/* Serialize the component Data */}
      <script
        type="application/json"
        id="protected-content-data"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(componentData),
        }}
      />
    </>
  )
}

ProtectedContent.afterDOMLoaded = script

export default (() => ProtectedContent) satisfies QuartzComponentConstructor
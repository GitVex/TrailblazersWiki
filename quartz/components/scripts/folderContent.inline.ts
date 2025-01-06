import { getUser, isAuthorized } from "./util"

function checkFolderContent() {
  const folderContentContainer = document.getElementById("page-list")
  if (!folderContentContainer) console.warn("Could not find page-list")

  const listElements = folderContentContainer?.querySelectorAll(".section-li") ?? []

  // console log amount of found elements
  // console.log(`Found ${listElements.length} elements`)

  const user = getUser() ?? ""

  listElements.forEach((li) => {
    const allowedUsers = li.getAttribute("data-allowedusers") ?? ""
    const tags = li.getAttribute("data-tags") ?? ""
    const title = li.getAttribute("data-for")?.replace("-", " ") ?? ""

    if (tags.includes("folder")) {
      // check if folder is part of the currently rendered explorer tree
      let explorerContainer = document.getElementById("explorer-content")
      if (!explorerContainer) {
        {
          console.warn("Could not find Explorer")
          // wait until explorer is loaded
          let explorerLoaded = false
          while (!explorerLoaded) {
            if (document.getElementById("explorer-content")) {
              explorerLoaded = true
              explorerContainer = document.getElementById("explorer-content")
            }
          }
        }
      }

      const folderTitles = explorerContainer?.querySelectorAll(".folder-title")

      if (!folderTitles) {
        console.warn("Could not find folder titles")
        return
      }

      function checkFolderTitle(el: Element) {
        // console.log(
        //   "Found:",
        //   el.textContent?.trim(),
        //   "Matches with:",
        //   title,
        //   el.textContent?.trim() === title,
        // )
        return el.textContent?.trim() === title
      }

      const hasFolder = Array.from(folderTitles).some((el) => checkFolderTitle(el))
      // console.log("Has folder:", hasFolder)
      if (!hasFolder) {
        li.remove()
      }
      return
    }

    if (!isAuthorized(user, allowedUsers)) {
      // console.log("removing", title)
      li.remove()
    }
  })
}

document.addEventListener("nav", () => {
  checkFolderContent()
})

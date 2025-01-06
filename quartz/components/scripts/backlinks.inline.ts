import { getUser, isAuthorized } from "./util"

function checkBacklinks() {
  // constrain the scope of the querySelector to the backlinks container
  const backlinksContainer = document.querySelector(".backlinks")
  const anchors = backlinksContainer?.querySelectorAll("a") ?? []

  const user = getUser() ?? ""

  anchors.forEach((a) => {
    const allowedUsers = a.getAttribute("data-allowedusers") ?? ""
    if (!isAuthorized(user, allowedUsers)) {
      a.hidden = true
    }
  })
}

document.addEventListener("nav", () => {
  checkBacklinks()
})

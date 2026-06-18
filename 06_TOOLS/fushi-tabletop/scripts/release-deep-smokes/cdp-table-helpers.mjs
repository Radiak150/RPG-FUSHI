export async function openGmTable(send, evaluate, delay, options = {}) {
  const password = options.password ?? 'mestre1'
  const attempts = options.attempts ?? 80
  const interval = options.interval ?? 250
  let lastState = null

  await evaluate(
    send,
    `(() => {
      if (location.hash !== '#/jogar/mesa') location.hash = '#/jogar/mesa'
      return location.href
    })()`,
  )

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    lastState = await evaluate(
      send,
      `(() => {
        const setValue = (element, value) => {
          const descriptor = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(element),
            'value',
          )
          descriptor?.set?.call(element, value)
          element.dispatchEvent(new Event('input', { bubbles: true }))
          element.dispatchEvent(new Event('change', { bubbles: true }))
        }

        const bodyText = document.body.innerText || ''
        const passwordInput = document.querySelector('input[type="password"]')
        const hasAccessGate = Boolean(document.querySelector('.access-gate'))
        const boardImage = document.querySelector('.tabletop-board__image')

        if (passwordInput instanceof HTMLInputElement) {
          const gmButton = Array.from(document.querySelectorAll('button')).find((button) => {
            const text = button.textContent?.trim() || ''
            return text.includes('Mestre') || text.includes('GM')
          })
          if (gmButton instanceof HTMLElement) gmButton.click()
          setValue(passwordInput, ${JSON.stringify(password)})
          const submitButton = document.querySelector('button[type="submit"]')
          if (submitButton instanceof HTMLElement) submitButton.click()
        }

        return {
          hash: location.hash,
          hasAccessGate,
          hasReadiness: Boolean(document.querySelector('.tabletop-readiness')),
          imageReady:
            !(boardImage instanceof HTMLImageElement) ||
            (boardImage.complete && boardImage.naturalWidth > 0),
          hasPasswordInput: passwordInput instanceof HTMLInputElement,
          hasTabletop: Boolean(document.querySelector('.tabletop-screen')),
          hasStage: Boolean(document.querySelector('.tabletop-board__stage')),
          hasRouteError: Boolean(document.querySelector('.route-error')),
          bodyText: bodyText.slice(0, 180),
        }
      })()`,
    )

    if (lastState?.hasRouteError) {
      throw new Error(`Mesa abriu tela de recuperacao: ${JSON.stringify(lastState)}`)
    }

    if (
      lastState?.hasTabletop &&
      lastState?.hasStage &&
      !lastState?.hasReadiness &&
      lastState?.imageReady
    ) {
      await ensureShortcutRail(send, evaluate, delay)
      return lastState
    }

    await delay(interval)
  }

  throw new Error(`Mesa nao ficou pronta para smoke CDP: ${JSON.stringify(lastState)}`)
}

async function ensureShortcutRail(send, evaluate, delay) {
  const railState = await evaluate(
    send,
    `(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const hasToolButton = buttons.some(
        (button) => button.getAttribute('aria-label') === 'Abrir ferramentas',
      )
      if (hasToolButton) {
        return { clicked: false, hasToolButton: true }
      }

      const shortcutButton = buttons.find(
        (button) => button.getAttribute('aria-label') === 'Abrir atalhos',
      )
      if (shortcutButton instanceof HTMLElement) {
        shortcutButton.click()
        return { clicked: true, hasToolButton: false }
      }

      return {
        clicked: false,
        hasToolButton: false,
        buttons: buttons.map((button) => button.textContent?.trim()).filter(Boolean).slice(0, 8),
      }
    })()`,
  )

  if (railState?.clicked) {
    await delay(260)
  }
}

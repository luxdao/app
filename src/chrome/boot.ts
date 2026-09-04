/** One key, one shape. Namespaced, because storage is shared with everything
 *  else this origin serves — and named for the app rather than for one of its
 *  tenants, because the same bundle is lux.vote, zoo.vote and hanzo.vote. */
export const KEY = 'vote.theme'

/**
 * The head script. Dark is what the document ships with, so only the other
 * answer has anything to do.
 *
 * This is a string handed to <head> by the build, and a string cannot import —
 * which is why the key lives in this file rather than beside the React state:
 * this is the module with no imports of its own, and both readers take the key
 * from here so there is one definition of it and not two that agree by luck.
 */
export const boot = () =>
  `try{var t=localStorage.getItem(${JSON.stringify(KEY)})` +
  `;if(t==='light'){var c=document.documentElement.classList` +
  `;c.remove('dark');c.add('light')}}catch(e){}`

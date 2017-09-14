// @flow
import { NoMatch } from '../errors'
import { EventTypes } from '../events'
import RouterStore from '../model/RouterStore'
import createRouteStateTreeNode from '../model/createRouteStateTreeNode'
import Navigation from '../model/Navigation'
import processEvent from './processEvent'

describe('processEvent', () => {
  let store
  let root

  beforeEach(() => {
    root = createRouteStateTreeNode({
      path: '',
      children: [
        {
          path: '',
          loadChildren: () => Promise.resolve([{ path: 'a' }, { path: 'b' }])
        }
      ]
    })
    store = new RouterStore(root)
  })

  test('dynamically loading children from a partially matched empty leaf', async () => {
    const events = await takeWhileIncomplete(
      {
        type: EventTypes.NAVIGATION_START,
        navigation: new Navigation({
          type: 'PUSH',
          to: { pathname: '/' }
        })
      },
      store
    )

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EventTypes.NAVIGATION_MATCH_RESULT }),
        expect.objectContaining({ type: EventTypes.CHILDREN_CONFIG_REQUEST }),
        expect.objectContaining({ type: EventTypes.CHILDREN_CONFIG_LOAD }),
        expect.objectContaining({ type: EventTypes.CHILDREN_LOAD }),
        expect.objectContaining({ type: EventTypes.NAVIGATION_ACTIVATED }),
        expect.objectContaining({ type: EventTypes.NAVIGATION_END })
      ])
    )
  })

  test('navigation ends in error when dynamic children cannot match pathname', async () => {
    const events = await takeWhileIncomplete(
      {
        type: EventTypes.NAVIGATION_START,
        navigation: new Navigation({
          type: 'PUSH',
          to: { pathname: '/c' }
        })
      },
      store
    )

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: EventTypes.CHILDREN_CONFIG_REQUEST }),
        expect.objectContaining({ type: EventTypes.NAVIGATION_MATCH_RESULT }),
        expect.objectContaining({ type: EventTypes.CHILDREN_CONFIG_LOAD }),
        expect.objectContaining({ type: EventTypes.CHILDREN_LOAD }),
        expect.objectContaining({
          type: EventTypes.NAVIGATION_ERROR,
          error: expect.any(NoMatch)
        })
      ])
    )
  })
})

async function takeWhileIncomplete(curr, store) {
  const events = []
  let count = 0

  // Try to resolve the navigation within a limited number of steps.
  while (count < 20) {
    curr = await processEvent(curr, store)
    events.push(curr)
    if (
      curr.type === EventTypes.NAVIGATION_END ||
      curr.type === EventTypes.NAVIGATION_CANCELLED
    ) {
      return events
    }
    count++
  }
  return events
}

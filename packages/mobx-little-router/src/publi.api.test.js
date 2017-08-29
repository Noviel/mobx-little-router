// @flow
import { autorun } from 'mobx'
import { createMemoryHistory } from 'history'
import { EventTypes } from './scheduling/events'
import { install }  from './'

describe('Public API', () => {
  let router

  beforeEach(() => {
    router = install({
      createHistory: [
        createMemoryHistory,
        { initialEntries: ['/initial'], initialIndex: 0 }
      ],
      routes: [{ path: ':whatever' }]
    })
  })

  test('reaction to push navigation', async () => {
    const changes = []
    await router.start()

    autorun(() => changes.push(router.store.location.pathname))

    router.push('/foo')
    await router.push('/bar')

    expect(router.store.location.pathname).toEqual('/bar/')

    await router.goBack()

    expect(router.store.location.pathname).toEqual('/foo/')

    router.push('/bar')
    await router.replace('/quux')

    expect(router.store.location.pathname).toEqual('/quux/')

    expect(changes).toEqual(['/initial/', '/foo/', '/bar/', '/foo/', '/bar/', '/quux/'])

    expect(router.store.nodes.map(node => node.value.path)).toEqual(['', ':whatever'])

    router.stop()
  })

  test('multiple navigation', async () => {
    const changes = []
    await router.start()

    autorun(() => changes.push(router.store.location.pathname))

    router.push('/1')
    router.push('/2')
    router.push('/3')
    router.push('/4')
    router.push('/5')
    router.push('/6')
    router.push('/7')
    router.push('/8')
    router.push('/9')
    await router.push('/10')

    expect(changes).toEqual([
      '/initial/',
      '/1/',
      '/2/',
      '/3/',
      '/4/',
      '/5/',
      '/6/',
      '/7/',
      '/8/',
      '/9/',
      '/10/'
    ])

    expect(router.store.nodes.map(node => node.value.path)).toEqual(['', ':whatever'])

    router.stop()
  })

  test('callback API', done => {
    const changes = []
    router.start(_router => {
      expect(_router).toBe(router)

      autorun(() => changes.push(_router.store.location.pathname))

      _router.push('/1').then(() => {
        expect(changes).toEqual(['/initial/', '/1/'])

        expect(_router.store.nodes.map(node => node.value.path)).toEqual([
          '',
          ':whatever'
        ])

        _router.stop()
        done()
      })
    })
  })

  describe('Events', () => {
    test('Subscription', async () => {
      const spy = jest.fn()
      const dispose = router.subscribeEvent(spy)
      await router.start()

      await router.push('/bar')

      expect(spy).toHaveBeenCalled()

      expect(spy.mock.calls.map(x => x[0].type)).toEqual(
        expect.arrayContaining([
          EventTypes.NAVIGATION_START,
          EventTypes.NAVIGATION_END
        ])
      )

      expect(spy.mock.calls.map(x => x[0].location.pathname)).toEqual(
        expect.arrayContaining([
          '/initial/',
          '/bar/'
        ])
      )

      dispose()
    })
  })
})
// @flow
import createRouteStateTreeNode from './createRouteStateTreeNode'
import createRoute from './createRoute'

describe('createRouteStateTreeNode', () => {
  let node

  beforeEach(() => {
    node = createRouteStateTreeNode(
      {
        path: '/a/:a/b/:b',
        children: [],
        getData: () => ({ message: 'Hello' })
      },
      () => ({
        user: 'Alice'
      })
    )
  })

  test('Sets the params, context and data', () => {
    expect(createRoute(node, '/root', '/a/1/b/2', { a: '1', b: '2' }, { q: 'hey' })).toEqual(
      expect.objectContaining({
        parentUrl: '/root',
        segment: '/a/1/b/2',
        value: `/root/a/1/b/2?q=hey`,
        params: { a: '1', b: '2' },
        query: { q: 'hey' },
        data: expect.objectContaining({ message: 'Hello' }),
        context: { user: 'Alice' }
      })
    )
  })
})

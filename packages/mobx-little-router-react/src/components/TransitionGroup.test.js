// @flow
import React from 'react'
import { createRouter, delay } from '../testUtil'
import { mount } from 'enzyme'
import TransitionGroup, { TransitionItem } from './TransitionGroup'
import { areRoutesEqual } from 'mobx-little-router'

describe('TransitionGroup', () => {
  let router
  
  const updateRoutes = (wrapper) => {
    let to, from
    if (router._store.routes.length > 1) { to = router._store.routes[1] }
    if (router._store.prevRoutes.length > 1) { from = router._store.prevRoutes[1] }

    const isTransitioning =
      router._store.prevRoutes.length > 0 &&
      !areRoutesEqual(to, from) &&
      (canTransition(to) || canTransition(from))

    wrapper.setProps({ to, from, isTransitioning })
  }

  const hasClass = (el, className) => {
    return el.html().indexOf(className) >= 0
  }

  beforeEach(() => {
    router = createRouter(
      [
        {
          path: 'about',
          getData: () => ({ component: AboutPage }),
          onTransition: () => {
            return delay(100)
          }
        },
        {
          path: 'contact',
          getData: () => ({ component: ContactPage }),
          onTransition: () => {
            return delay(100)
          }
        }
      ],
      '/'
    )
    return router.start()
  })

  afterEach(() => {
    router.stop()
  })

  test('TransitionGroup initial state is empty', async () => {
    const wrapper = mount(<TransitionGroup isTransitioning={false} />)
    expect(wrapper.find(TransitionItem).length).toBe(0)
  })

  test('TransitionGroup has TransitionItem after route change', async () => {
    const wrapper = mount(<TransitionGroup isTransitioning={false} />)
    
    router.push('/about')
    await delay(0)
    updateRoutes(wrapper)

    expect(wrapper.find(TransitionItem).length).toBe(1)
  })

  // XXX note that classList mutations are no longer picked up by enzyme
  // We need to mutate the classlist in this fashion to trigger the animation in the most
  // efficient way possible. The hasClass helper uses enzymes .html() function to view the raw html
  // we use this to check the animation lifecycle classes are correctly applied.
  test('TransitionGroup handles transitioning in and out of routes', async () => {
    const wrapper = mount(<TransitionGroup isTransitioning={false} />)
    const { routes, prevRoutes } = router._store

    router.push('/about')
    await delay(0)
    updateRoutes(wrapper)

    // Initially we should be transitioning and have the enter class
    expect(wrapper.find(TransitionItem).hasClass('transitioning')).toBe(true)
    expect(wrapper.find(TransitionItem).hasClass('enter')).toBe(true)

    await delay(1000)

    // Then the animation is initialized with the active class
    expect(routes[1].data.transitionState).toBe('entering')
    //XXX expect(wrapper.find(TransitionItem).hasClass('enter-active')).toBe(true)
    expect(hasClass(wrapper.find(TransitionItem).at(0), 'enter-active')).toBe(true)

    // Wait for transition to complete
    await delay(150)
    updateRoutes(wrapper)

    // Our transition has settled and transitioning class removed 
    expect(wrapper.childAt(0).childAt(0).hasClass('transitioning')).toBe(false)
    expect(wrapper.childAt(0).childAt(0).hasClass('enter-active')).toBe(false)
    expect(routes[1].data.transitionState).toBe('entered')

    router.push('/contact')
    await delay(0)
    updateRoutes(wrapper)

    // Now we will have two transitioning elements
    expect(wrapper.find(TransitionItem).length).toBe(2)
    expect(wrapper.find(TransitionItem).at(0).hasClass('transitioning')).toBe(true)
    expect(wrapper.find(TransitionItem).at(1).hasClass('transitioning')).toBe(true)
    expect(wrapper.find(TransitionItem).at(0).hasClass('exit')).toBe(true)
    expect(wrapper.find(TransitionItem).at(1).hasClass('enter')).toBe(true)

    await delay(0)

    // Then the animation is initialized with the active class
    expect(routes[1].data.transitionState).toBe('entering')
    expect(prevRoutes[1].data.transitionState).toBe('exiting')
    //XXX expect(wrapper.find(TransitionItem).at(0).hasClass('exit-active')).toBe(true)
    //XXX expect(wrapper.find(TransitionItem).at(1).hasClass('enter-active')).toBe(true)
    expect(hasClass(wrapper.find(TransitionItem).at(0), 'exit-active')).toBe(true)
    expect(hasClass(wrapper.find(TransitionItem).at(1), 'enter-active')).toBe(true)

    // Wait for the transition to complete
    await delay(150)
    updateRoutes(wrapper)

    // Our transition has settled and transitioning class removed 
    expect(wrapper.find(TransitionItem).length).toBe(1)
    expect(wrapper.find(TransitionItem).hasClass('transitioning')).toBe(false)
  })
})

const AboutPage = ({ className }) => <div className={className}>AboutPage</div>
const ContactPage = ({ className }) => <div className={className}>ContactPage</div>

const canTransition = node => (node ? typeof node.onTransition === 'function' : false)

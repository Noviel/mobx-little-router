import React from 'react'
import * as mobx from 'mobx'
import ReactDOM from 'react-dom'
import { createHashHistory } from 'history'
import { install, RouterProvider } from 'mobx-little-router-react'
import stores from './stores'

import { HomeRoute, LoginRoute, ShowsRoute, AboutRoute, ContactRoute, ShowRoute, TagRoute, ActorRoute, AdminRoute } from './routes'
import App from './App'

const delay = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

const router = install({
  history: createHashHistory(),
  getContext: () => ({
    stores
  }),
  routes: [
    { path: '', match: 'full', component: HomeRoute },
    { path: 'redirect', match: 'full', redirectTo: '/shows' },
    { path: 'login', component: LoginRoute },
    { path: 'about', component: AboutRoute, animate: true },
    { path: 'contact', component: ContactRoute, animate: true },
    {
      path: 'shows',
      query: ['q'],
      component: ShowsRoute,
      children: [{
        path: ':id',
        component: ShowRoute,
        outlet: 'modal',
        animate: true
      }]
    },
    {
      path: 'actors/:id',
      component: ActorRoute,
      outlet: 'modal',
      animate: true
    },
    {
      path: 'tags/:tag',
      component: TagRoute
    },
    {
      path: 'admin',
      component: AdminRoute,
      canActivate: (route, navigation) => {
        const { stores: { SessionStore } } = route.context

        if (SessionStore.isAuthenticated) {
          return true
        } else {
          SessionStore.unauthorizedNavigation = navigation
          return navigation.redirectTo('/login')
        }
      },
      willResolve: () => delay(1000)
    }
  ]
})

window.store = router.store
window.router = router
window.mobx = mobx

router.subscribeEvent((ev) => {
  if (ev.type === 'NAVIGATION_START') {
    console.group(`Navigation (${ev.navigation.sequence})`)
  }
  console.log(ev.type, ev.navigation || ev.nextNavigation)
  if (ev.type === 'NAVIGATION_END' || ev.type === 'NAVIGATION_CANCELLED') {
    console.groupEnd()
  }
})

router.start(() => {
  ReactDOM.render(
    <RouterProvider router={router}>
      <App />
    </RouterProvider>,
    document.getElementById('root')
  )
})

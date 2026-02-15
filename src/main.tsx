import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import './index.css'

// Register PWA Service Worker
import { registerSW } from 'virtual:pwa-register'

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('发现新版本，是否立即更新？')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('应用已准备好离线使用')
  },
})

import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Assets } from './pages/Assets'
import { IncomeExpense } from './pages/IncomeExpense'
import { Journal } from './pages/Journal'
import { TagAnalysis } from './pages/TagAnalysis'
import { QuickEntry } from './pages/QuickEntry'
import { AccountDetail } from './pages/AccountDetail'
import { Settings } from './pages/Settings'
import { Analytics } from './pages/Analytics'
import { LedgerList } from './pages/LedgerList'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      retry: 1,
    },
  },
})

const router = createBrowserRouter([
  {
    path: '/',
    element: <LedgerList />,
  },
  {
    path: '/:ledger',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'assets',
        element: <Assets />,
      },
      {
        path: 'income-expense',
        element: <IncomeExpense />,
      },
      {
        path: 'journal',
        element: <Journal />,
      },
      {
        path: 'tags',
        element: <TagAnalysis />,
      },
      {
        path: 'entry',
        element: <QuickEntry />,
      },
      {
        path: 'account/:account',
        element: <AccountDetail />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)

import PackagePage from '@/pages/PackagePage'
import OfferPage from  '@/pages/OfferPage'
import TestPage from  '@/pages/TestPage'
import Header from '@/components/Header'
import { UserProvider } from './context/UserProvider'
import Footer from '@/components/Footer'

function App() {
  return (
    <UserProvider>
      <Header />
      <PackagePage />
      <OfferPage />
      <TestPage />
      <Footer />
    </UserProvider>
  )
}

export default App;
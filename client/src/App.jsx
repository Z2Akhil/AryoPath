import PackagePage from '@/pages/PackagePage'
import OfferPage from  '@/pages/OfferPage'
import TestPage from  '@/pages/TestPage'
import Header from '@/components/Header'
import Footer from './components/Footer'
function App() {
  return (
    <>
      <Header />
      <PackagePage/>
      <OfferPage/>
      <TestPage/>
      <Footer />
    </>
  )
}

export default App

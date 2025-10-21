import PackagePage from '@/pages/PackagePage'
import OfferPage from  '@/pages/OfferPage'
import TestPage from  '@/pages/TestPage'
import Header from '@/components/Header'
import PackageDetailedPage from '@/pages/PackageDetailedPage'
import Form from '@/components/Form'
function App() {
  return (
    <>
      <Header />
      <PackagePage/>
      <OfferPage/>
      <TestPage/>
      <PackageDetailedPage/>
    </>
  )
}

export default App

import { Helmet } from 'react-helmet-async';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CropGuidesViewer } from '@/components/guides/CropGuidesViewer';

const CropGuidesPage = () => {
  return (
    <>
      <Helmet>
        <title>कृषि ज्ञान - Crop Guides | Farmer Gpt</title>
        <meta name="description" content="Learn about different crops - soil preparation, sowing, fertilizers, pest control, and harvesting techniques." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <CropGuidesViewer />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CropGuidesPage;

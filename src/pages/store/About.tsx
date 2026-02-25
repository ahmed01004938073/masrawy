import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import SocialLinks from "@/components/store/SocialLinks";
import { useStoreStatus } from "@/hooks/useStoreStatus";

const About = () => {
  const navigate = useNavigate();
  const { settings, loading } = useStoreStatus();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">عن المنصة</h1>
          <Button onClick={() => navigate(-1)} variant="outline">
            العودة
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {settings?.storeNameImage ? (
                <img
                  src={settings.storeNameImage}
                  alt={settings.displayName}
                  className="h-10 object-contain"
                />
              ) : (
                <>
                  <Info className="w-5 h-5" />
                  <span>{settings?.displayName}</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {settings?.aboutPageContent ? (
                <div dangerouslySetInnerHTML={{ __html: settings.aboutPageContent }} />
              ) : (
                <p className="text-muted-foreground">
                  لا يوجد محتوى متاح حالياً.
                </p>
              )}
            </div>

            <div className="mt-8 pt-6 border-t">
              <SocialLinks />
            </div>

            <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10 text-center">
              <h3 className="font-semibold text-lg mb-2">هل ترغب في الانضمام إلينا؟</h3>
              <Button onClick={() => navigate("/contact")} className="mt-2">
                تواصل معنا
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;

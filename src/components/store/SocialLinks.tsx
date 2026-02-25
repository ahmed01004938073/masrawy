import { getSiteSettings } from "@/services/siteSettingsService";
import { Facebook, Twitter, Instagram, Youtube, Linkedin, MessageCircle, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SocialLink {
    id: number;
    platform: string;
    url: string;
    active: boolean;
}

const SocialLinks = () => {
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

    useEffect(() => {
        const loadSocialLinks = async () => {
            const settings = await getSiteSettings();
            if (settings?.socialLinks && Array.isArray(settings.socialLinks)) {
                setSocialLinks(settings.socialLinks.filter(link => link.active));
            } else {
                setSocialLinks([]);
            }
        };

        loadSocialLinks();
        window.addEventListener('storage', loadSocialLinks);
        return () => window.removeEventListener('storage', loadSocialLinks);
    }, []);

    const getSocialIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'facebook':
                return <Facebook className="w-4 h-4" />;
            case 'twitter':
                return <Twitter className="w-4 h-4" />;
            case 'instagram':
                return <Instagram className="w-4 h-4" />;
            case 'youtube':
                return <Youtube className="w-4 h-4" />;
            case 'linkedin':
                return <Linkedin className="w-4 h-4" />;
            case 'whatsapp':
                return <MessageCircle className="w-4 h-4" />;
            case 'telegram':
                return <Send className="w-4 h-4" />;
            case 'tiktok':
                return <Video className="w-4 h-4" />;
            default:
                return null;
        }
    };

    if (socialLinks.length === 0) {
        return null;
    }

    return (
        <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">تابعنا على</h3>
            <div className="flex gap-3 flex-wrap">
                {socialLinks.map((link) => (
                    <Button
                        key={link.id}
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(link.url, '_blank')}
                        title={link.platform}
                    >
                        {getSocialIcon(link.platform)}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default SocialLinks;

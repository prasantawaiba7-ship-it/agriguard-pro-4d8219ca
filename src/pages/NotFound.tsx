import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-primary mb-3">404</h1>
        <p className="text-lg text-muted-foreground mb-2">
          यो पेज भेटिएन
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Page not found. Let's get you back home.
        </p>
        <Link to="/">
          <Button size="lg" className="rounded-full px-8 gap-2">
            <Home className="w-4 h-4" />
            गृहपृष्ठमा जानुहोस्
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;

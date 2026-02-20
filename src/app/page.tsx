'use client';

import { Box, Button, Container, Typography, Grid, Paper, Stack, useTheme, Card, CardContent } from '@mui/material';
import {
  TrendingUp,
  Receipt,
  ListChecks,
  ShieldCheck,
  ArrowRight,
  Download,
  BrainCircuit,
  PieChart,
  ShieldAlert,
  Fingerprint,
  Rocket
} from 'lucide-react';
import PublicNav from '@/components/PublicNav';
import Link from 'next/link';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionPaper = motion(Paper);

export default function LandingPage() {
  const theme = useTheme();

  const suiteApps = [
    {
      title: 'Track-It',
      description: 'Inventory & Sales OS. Live stock updates and professional POS capabilities.',
      icon: <ListChecks size={32} />,
      gradient: 'var(--track-it-gradient)',
      color: '#0ea5e9'
    },
    {
      title: 'Tax1',
      description: 'Tax Intelligence. Automated VAT, deductibles tracking, and one-click compliance.',
      icon: <Receipt size={32} />,
      gradient: 'var(--tax1-gradient)',
      color: '#10b981'
    },
    {
      title: 'ChaseAI',
      description: 'Debt Recovery Brain. AI-powered reminders that get you paid 3x faster.',
      icon: <BrainCircuit size={32} />,
      gradient: 'var(--chase-gradient)',
      color: '#f43f5e'
    },
    {
      title: 'Intelligence',
      description: 'Behavioral Insights. Predict cashflow and optimize business timing.',
      icon: <PieChart size={32} />,
      gradient: 'var(--suite-gradient)',
      color: '#6366f1'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
      <PublicNav />

      {/* Hero Section */}
      <Box sx={{
        position: 'relative',
        pt: { xs: 10, md: 20 },
        pb: { xs: 8, md: 15 },
        overflow: 'hidden'
      }}>
        {/* Abstract Background Shapes */}
        <Box sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '40%',
          height: '60%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
          filter: 'blur(100px)',
          zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: '10%',
          left: '-10%',
          width: '30%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack spacing={4} alignItems="center" textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 2,
                  mb: 2
                }}
              >
                The Unified Business Operating System
              </Typography>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.8rem', md: '4.5rem' },
                  lineHeight: 1.1,
                  mb: 3,
                  background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Empowering Nigerian <br />
                <Box component="span" sx={{ background: 'var(--suite-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Ambition with Intelligence.
                </Box>
              </Typography>
              <Typography variant="h5" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto', mb: 5, lineHeight: 1.6 }}>
                One suite. Four powerful apps. NEntreOS brings together inventory, tax compliance, AI-debt recovery, and deep business intelligence into a single, seamless experience.
              </Typography>
            </MotionBox>

            <MotionBox
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  href="/signup"
                  endIcon={<ArrowRight size={20} />}
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    boxShadow: '0 10px 40px rgba(99, 102, 241, 0.3)',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 15px 50px rgba(99, 102, 241, 0.4)' }
                  }}
                >
                  Start Your Suite Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  href="/login"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.1rem',
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2, bgcolor: 'rgba(99, 102, 241, 0.05)' }
                  }}
                >
                  Dashboard Login
                </Button>
              </Stack>
            </MotionBox>
          </Stack>
        </Container>
      </Box>

      {/* The Suite Section */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Box sx={{ mb: 10, textAlign: 'center' }}>
          <Typography variant="h2" gutterBottom>Meet the NEntreOS Suite</Typography>
          <Typography variant="h6" color="text.secondary">A harmonious ecosystem designed to scale your SME.</Typography>
        </Box>

        <Grid container spacing={4}>
          {suiteApps.map((app, index) => (
            <Grid key={app.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <MotionPaper
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                sx={{
                  p: 4,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    background: app.gradient
                  }
                }}
              >
                <Box sx={{
                  p: 1.5,
                  borderRadius: 3,
                  background: app.gradient,
                  color: 'white',
                  mb: 3
                }}>
                  {app.icon}
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>{app.title}</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>{app.description}</Typography>
                <Button
                  size="small"
                  sx={{ mt: 'auto', fontWeight: 700, p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}
                >
                  Learn More <ArrowRight size={16} style={{ marginLeft: '4px' }} />
                </Button>
              </MotionPaper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Trust & Intelligence Section */}
      <Box sx={{ py: 15, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: 'relative' }}>
                <MotionBox
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="glass-card"
                  sx={{
                    p: 4,
                    borderRadius: 8,
                    position: 'relative',
                    zIndex: 2,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.1)'
                  }}
                >
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Fingerprint size={32} color={theme.palette.primary.main} />
                      <Typography variant="h6">Biometric Security & RLS</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <ShieldAlert size={32} color={theme.palette.error.main} />
                      <Typography variant="h6">Real-time Fraud Detection</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Rocket size={32} color={theme.palette.success.main} />
                      <Typography variant="h6">Cloud-Native Scalability</Typography>
                    </Box>
                  </Stack>
                </MotionBox>
                {/* Decoration */}
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: '100%',
                  height: '100%',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 8,
                  zIndex: 1
                }} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" gutterBottom>Intelligence <br /> Built for Nigeria.</Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
                We've combined deep local knowledge with global AI standards. Our suite doesn't just record data—it understands the nuances of the Nigerian market, from VAT compliance to WhatsApp-driven collections.
              </Typography>
              <Button variant="contained" size="large">Explore the Intelligence Hub</Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Bottom CTA */}
      <Container maxWidth="md" sx={{ py: 15, textAlign: 'center' }}>
        <Typography variant="h2" fontWeight="bold" gutterBottom>Ready to switch to the Suite?</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
          Join the new generation of Nigerian SMEs using NEntreOS to dominate their industries.
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={Link}
          href="/signup"
          sx={{ px: 8, py: 2.5, fontSize: '1.2rem' }}
        >
          Get Started Now
        </Button>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 8, borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={4}>
            <Box>
              <Typography variant="h5" fontWeight="bold" sx={{ background: 'var(--suite-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                NEntreOS Suite
              </Typography>
              <Typography variant="body2" color="text.secondary">Building the future of Nigerian SME infrastructure.</Typography>
            </Box>
            <Stack direction="row" spacing={4}>
              <Link href="#" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Privacy</Link>
              <Link href="#" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Terms</Link>
              <Link href="#" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.7 }}>Help</Link>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} NEntreOS Suite. Built with ❤️ for Nigeria.
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}


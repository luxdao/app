import { Box, Flex, Grid, Image, Text, Link as ChakraLink } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FEATURED_DAOS, CHAIN_NAMES, type FeaturedDAO } from '../../constants/featuredDAOs';
import { DAO_ROUTES } from '../../constants/routes';

function DAOCard({ dao }: { dao: FeaturedDAO }) {
  // Only show DAOs with real addresses (not placeholder zeros)
  const isPlaceholder = dao.address === '0x0000000000000000000000000000000000000001';

  return (
    <Box
      as={isPlaceholder ? 'div' : Link}
      to={isPlaceholder ? undefined : DAO_ROUTES.dao.relative(dao.addressPrefix, dao.address)}
      p="1rem"
      borderRadius="lg"
      border="1px solid"
      borderColor="neutral-4"
      bg="neutral-2"
      _hover={isPlaceholder ? {} : { bg: 'neutral-3', borderColor: 'neutral-5' }}
      transition="all 0.2s"
      opacity={isPlaceholder ? 0.6 : 1}
      cursor={isPlaceholder ? 'default' : 'pointer'}
    >
      <Flex gap="0.75rem" align="center">
        <Box
          w="2.5rem"
          h="2.5rem"
          borderRadius="full"
          bg="neutral-3"
          display="flex"
          alignItems="center"
          justifyContent="center"
          overflow="hidden"
        >
          {dao.logo ? (
            <Image src={dao.logo} alt={dao.name} w="100%" h="100%" objectFit="cover" />
          ) : (
            <Text fontSize="lg" fontWeight="bold" color="neutral-7">
              {dao.name.charAt(0)}
            </Text>
          )}
        </Box>
        <Box flex="1" minW="0">
          <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
            {dao.name}
          </Text>
          <Text fontSize="xs" color="neutral-7" noOfLines={1}>
            {CHAIN_NAMES[dao.chainId] || `Chain ${dao.chainId}`}
          </Text>
        </Box>
      </Flex>
      <Text fontSize="xs" color="neutral-6" mt="0.5rem" noOfLines={2}>
        {dao.description}
      </Text>
      {dao.domain && (
        <ChakraLink
          href={`https://${dao.domain}`}
          isExternal
          fontSize="xs"
          color="celery-0"
          mt="0.25rem"
          display="block"
          onClick={e => e.stopPropagation()}
        >
          {dao.domain}
        </ChakraLink>
      )}
    </Box>
  );
}

export function FeaturedDAOs() {
  const { t } = useTranslation('home');

  // Group by category
  const ecosystemDAOs = FEATURED_DAOS.filter(d => d.category === 'ecosystem');
  const productDAOs = FEATURED_DAOS.filter(d => d.category === 'product');
  const communityDAOs = FEATURED_DAOS.filter(d => d.category === 'community' || d.category === 'research');

  return (
    <Box mt="2rem">
      <Text textStyle="text-lg-mono-semibold" mb="1rem">
        {t('featuredDAOs', 'Featured DAOs')}
      </Text>

      {/* Ecosystem DAOs - one per chain */}
      <Text textStyle="text-sm-mono-semibold" color="neutral-7" mb="0.5rem">
        Ecosystem
      </Text>
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
        gap="1rem"
        mb="1.5rem"
      >
        {ecosystemDAOs.map(dao => (
          <DAOCard key={`${dao.chainId}-${dao.address}`} dao={dao} />
        ))}
      </Grid>

      {/* Product DAOs */}
      <Text textStyle="text-sm-mono-semibold" color="neutral-7" mb="0.5rem">
        Products
      </Text>
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gap="1rem"
        mb="1.5rem"
      >
        {productDAOs.map(dao => (
          <DAOCard key={`${dao.chainId}-${dao.address}`} dao={dao} />
        ))}
      </Grid>

      {/* Community DAOs */}
      <Text textStyle="text-sm-mono-semibold" color="neutral-7" mb="0.5rem">
        Community
      </Text>
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gap="1rem"
      >
        {communityDAOs.map(dao => (
          <DAOCard key={`${dao.chainId}-${dao.address}`} dao={dao} />
        ))}
      </Grid>
    </Box>
  );
}

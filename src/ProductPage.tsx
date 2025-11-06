import { Container, Breadcrumbs, Link, Typography, Rating, Divider, IconButton, Box } from '@mui/material'
import HomeRoundedIcon from '@mui/icons-material/HomeRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded'
import { useQuery } from '@tanstack/react-query'

type SpecSection = {
  title?: string
  content?: Array<{ header?: string; body?: string }>
}

type Product = {
  id: string
  imagesUrls?: string[]
  image?: string
  name?: string
  title?: string
  headline?: string
  price?: string | number | null
  discountedPrice?: string | number | null
  newBestPrice?: string | number | null
  collapseBestPrice?: string | number | null
  priceList?: string | number | null
  description?: string
  edito?: string
  specifications?: { sections?: { entry?: SpecSection[] } }
  rating?: number
  globalRating?: { score?: number; nbReviews?: number }
  reviewsCount?: number
  reviewCount?: number
  contributor?: { caption?: string }
  prdCategory?: string
  categories?: string[]
  reviews?: Array<{
    note?: number
    title?: string
    description?: string
    author?: { login?: string; firstName?: string }
    date?: number
  }>
  [k: string]: any
}

const PRODUCT_ID = '13060247469'

async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`https://api-rakuten-vis.koyeb.app/product/${id}`)
  if (!res.ok) throw new Error('Erreur API')
  const json = await res.json()
  return (json.data ?? json) as Product
}

const stripHtml = (html?: string) => {
  if (!html) return ''
  const textOnly = html.replace(/<[^>]+>/g, ' ')
  const decoded = new DOMParser().parseFromString(textOnly, 'text/html').documentElement.textContent || ''
  return decoded.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
}

const getName = (p: Product) => p.name || p.title || p.headline || 'Produit'
const getImage = (p: Product) => p.image || p.imagesUrls?.[0] || ''
const getRating = (p: Product) => p.rating ?? p.globalRating?.score ?? 0
const getReviewsCount = (p: Product) =>
  p.reviewsCount ?? p.reviewCount ?? p.globalRating?.nbReviews ?? (p.reviews ? p.reviews.length : 0)

function parsePrice(input?: string | number | null): number | undefined {
  if (input === null || input === undefined) return undefined
  const str = String(input)
  const cleaned = str.replace(/[^\d,.\-]/g, '')
  const match = cleaned.match(/-?\d+(?:[.,]\d+)?/)
  if (!match) return undefined
  const candidate = match[0]
  const normalized =
    candidate.includes(',') && candidate.includes('.')
      ? candidate.replace(/\./g, '').replace(',', '.')
      : candidate.replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

function finalPriceNum(p: Product): number | undefined {
  const candidates = [p.discountedPrice, p.newBestPrice, p.collapseBestPrice, p?.buybox?.salePrice, p.price]
  for (const c of candidates) {
    const n = parsePrice(c as any)
    if (n !== undefined) return n
  }
  return undefined
}

function basePriceForStrike(p: Product, fin?: number): number | undefined {
  const bases = [p.priceList, p.price]
  const base = bases.map(parsePrice).find((n) => n !== undefined)
  if (base === undefined || fin === undefined) return undefined
  return base > fin + 0.01 ? base : undefined
}

const fmtEUR = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

function humanizeCategory(p: Product) {
  const raw = p.prdCategory?.split('_').pop() || p.categories?.[0] || ''
  const cleaned = raw.replace(/[-_]/g, ' ').trim()
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : ''
}

function specRows(p: Product): Array<{ label: string; value: string; section?: string }> {
  const out: Array<{ label: string; value: string; section?: string }> = []
  const sections = p.specifications?.sections?.entry || []
  for (const s of sections) {
    for (const c of s.content || []) {
      const label = (c.header || '').trim()
      const value = (c.body || '').trim()
      if (label || value) out.push({ label, value, section: s.title || undefined })
    }
  }
  return out
}

function parseLabelValueList(html?: string): Array<{ label: string; value: string }> {
  if (!html) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items = Array.from(doc.querySelectorAll('li.sub'))
  return items
    .map((li) => {
      const label = (li.querySelector('.label')?.textContent || '').replace(/\s*:\s*$/, '').trim()
      const value = (li.querySelector('.value')?.textContent || '').trim()
      return label || value ? { label, value } : null
    })
    .filter(Boolean) as Array<{ label: string; value: string }>
}

function sanitizeHtml(html?: string): string {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const allowed = new Set(['H3', 'P', 'UL', 'LI', 'B', 'STRONG', 'EM'])
  doc.body.querySelectorAll('*').forEach((el) => {
    if (!allowed.has(el.tagName)) {
      const parent = el.parentNode
      while (el.firstChild) parent?.insertBefore(el.firstChild, el)
      parent?.removeChild(el)
    }
  })
  return doc.body.innerHTML
}

export default function ProductPage() {
  const { data, isLoading, isError } = useQuery<Product, Error>({
    queryKey: ['product', PRODUCT_ID],
    queryFn: () => fetchProduct(PRODUCT_ID),
  })

  if (isLoading) {
    return (
      <Container className="container-pg">
        <div className="loading-box" role="status" aria-live="polite">
          <div className="spinner" />
          <div>Chargement du produit…</div>
        </div>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="container-pg">
        <div className="error-card" role="alert">
          <div className="error-title">Produit introuvable</div>
          <div className="error-sub">Vérifie l’identifiant produit ou réessaie plus tard.</div>
        </div>
      </Container>
    )
  }

  const name = getName(data)
  const image = getImage(data)
  const fin = finalPriceNum(data)
  const baseStrike = basePriceForStrike(data, fin)
  const category = (humanizeCategory(data) || 'Produit').toLowerCase()
  const brand = data.contributor?.caption
  const rating = getRating(data)
  const reviewsCount = getReviewsCount(data)
  const showRating = rating > 0 && reviewsCount > 0
  const specs = specRows(data)
  const descPairs = parseLabelValueList(data.description)
  const editoHtml = sanitizeHtml(data.edito)
  const fallbackText = stripHtml(data.description || data.edito)

  return (
    <Container className="container-pg">
      <Box className="breadcrumbs-bar">
        <nav aria-label="fil d’Ariane" className="breadcrumbs">
          <Breadcrumbs
            separator={<ChevronRightRoundedIcon fontSize="small" className="crumb-sep" />}
            maxItems={4}
            itemsAfterCollapse={2}
            itemsBeforeCollapse={1}
          >
            <Link underline="hover" color="inherit" href="/" className="crumb-link">
              <HomeRoundedIcon fontSize="small" className="crumb-home" />
              Accueil
            </Link>
            <Link underline="hover" color="inherit" href="/categorie" className="crumb-link">
              {category}
            </Link>
            <Typography color="text.primary" className="crumb-current" aria-current="page">
              {name}
            </Typography>
          </Breadcrumbs>
        </nav>

        <div className="breadcrumbs-actions">
          <IconButton aria-label="Panier" className="cart-btn" onClick={() => {}} size="small">
            <ShoppingCartRoundedIcon />
          </IconButton>
        </div>
      </Box>

      <div className="product-card">
        <div className="image-panel">
          <img src={image} alt={name} className="product-image" />
        </div>

        <div className="info-panel">
          <Typography variant="h4" className="title">{name}</Typography>

          <div className="rating-line">
            {showRating ? (
              <>
                <Rating value={Number(rating)} precision={0.1} readOnly />
                <span className="rating-text">
                  {rating.toFixed(1)} / 5{reviewsCount ? ` · ${reviewsCount} avis` : ''}
                </span>
              </>
            ) : (
              <span className="rating-text">Pas encore d’avis</span>
            )}
          </div>

          <div className="price-line">
            {fin !== undefined ? (
              <div className="price-block">
                {baseStrike !== undefined && (
                  <span className="price-old-label">
                    Prix conseillé <span className="price-old">{fmtEUR(baseStrike)}</span>
                  </span>
                )}
                <span className="price-new">{fmtEUR(fin)}</span>
              </div>
            ) : (
              <span className="price-missing">Prix indisponible</span>
            )}

            <button
              type="button"
              className={`buy-btn${fin === undefined ? ' disabled' : ''}`}
              onClick={(e) => e.preventDefault()}
            >
              Acheter ce produit
            </button>
          </div>

          <Divider className="divider" />

          {brand && (
            <div className="meta-row">
              <span className="meta-label">Fabricant</span>
              <span className="meta-value">{brand}</span>
            </div>
          )}

          {specs.length > 0 ? (
            <>
              {Array.from(new Set(specs.map((r) => r.section).filter(Boolean))).map((section) => (
                <div key={String(section)} style={{ marginBottom: 12 }}>
                  <div className="meta-label" style={{ marginBottom: 6 }}>{section}</div>
                  {specs
                    .filter((r) => r.section === section)
                    .map((r, i) => (
                      <div key={`${section}-${i}`} className="meta-row">
                        <span className="meta-label">{r.label}</span>
                        <span className="meta-value">{r.value}</span>
                      </div>
                    ))}
                </div>
              ))}
              {specs
                .filter((r) => !r.section)
                .map((r, i) => (
                  <div key={`nosct-${i}`} className="meta-row">
                    <span className="meta-label">{r.label}</span>
                    <span className="meta-value">{r.value}</span>
                  </div>
                ))}
            </>
          ) : descPairs.length > 0 ? (
            <>
              {descPairs.map((row, i) => (
                <div key={i} className="meta-row">
                  <span className="meta-label">{row.label}</span>
                  <span className="meta-value">{row.value}</span>
                </div>
              ))}
            </>
          ) : editoHtml ? (
            <div className="desc">
              <span className="meta-label">Présentation</span>
              <div className="desc-text" dangerouslySetInnerHTML={{ __html: editoHtml }} />
            </div>
          ) : fallbackText ? (
            <div className="desc">
              <span className="meta-label">Description</span>
              <p className="desc-text">{fallbackText}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="reviews-block">
        <Typography variant="h6" className="reviews-title">Avis</Typography>
        {data.reviews && data.reviews.length > 0 ? (
          <div className="reviews-list">
            {data.reviews.map((r, i) => (
              <div key={i} className="review-item">
                <div className="review-head">
                  <Rating value={Number(r.note) || 0} precision={0.5} readOnly size="small" />
                  <span className="review-author">{r.author?.firstName || r.author?.login || 'Client'}</span>
                </div>
                {r.title && <div className="review-title">{r.title}</div>}
                {r.description && <div className="review-text">{stripHtml(r.description)}</div>}
              </div>
            ))}
          </div>
        ) : (
          <Typography color="text.secondary">Pas encore d’avis</Typography>
        )}
      </div>
    </Container>
  )
}
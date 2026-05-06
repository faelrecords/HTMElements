import {
  Heading1, Type, MousePointerClick, Image as ImageIcon,
  Minus, Square, Layout, List, Link2, Code2, Columns3, Rows3,
  BadgeCheck, Star, Quote, Mail, Video, MapPin
} from 'lucide-react'

export const ELEMENT_TEMPLATES = [
  {
    category: 'Básicos',
    items: [
      {
        id: 'h1',
        label: 'Título H1',
        icon: Heading1,
        html: '<h1 style="font-size:32px;font-weight:700;margin:16px 0;">Título principal</h1>',
      },
      {
        id: 'h2',
        label: 'Título H2',
        icon: Heading1,
        html: '<h2 style="font-size:24px;font-weight:700;margin:14px 0;">Subtítulo</h2>',
      },
      {
        id: 'p',
        label: 'Parágrafo',
        icon: Type,
        html: '<p style="font-size:16px;line-height:1.55;margin:12px 0;">Texto do parágrafo. Clique para editar.</p>',
      },
      {
        id: 'button',
        label: 'Botão',
        icon: MousePointerClick,
        html: '<a href="#" style="display:inline-block;padding:12px 24px;background:#6d71f0;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Clique aqui</a>',
      },
      {
        id: 'badge',
        label: 'Badge',
        icon: BadgeCheck,
        html: '<span style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;border-radius:999px;font-size:13px;font-weight:700;">Badge</span>',
      },
      {
        id: 'link',
        label: 'Link',
        icon: Link2,
        html: '<a href="#" style="color:#6d71f0;text-decoration:underline;">Texto do link</a>',
      },
      {
        id: 'quote',
        label: 'Citação',
        icon: Quote,
        html: '<blockquote style="padding:20px 24px;border-left:4px solid #6d71f0;background:#f8fafc;color:#334155;font-size:18px;line-height:1.55;margin:20px 0;">Texto da citação.</blockquote>',
      },
    ],
  },
  {
    category: 'Mídia',
    items: [
      {
        id: 'image',
        label: 'Imagem',
        icon: ImageIcon,
        html: '<img src="https://placehold.co/600x400/e5e7eb/6b7280?text=Imagem" alt="Imagem" style="max-width:100%;height:auto;border-radius:8px;display:block;">',
      },
      {
        id: 'video',
        label: 'Vídeo',
        icon: Video,
        html: '<video controls style="width:100%;max-width:720px;border-radius:12px;display:block;background:#111827;"><source src="" type="video/mp4"></video>',
      },
      {
        id: 'media',
        label: 'Imagem/Vídeo',
        icon: ImageIcon,
        html: '<figure style="margin:24px 0;max-width:760px;"><img src="https://placehold.co/900x520/e5e7eb/64748b?text=Imagem+ou+Video" alt="Mídia" style="width:100%;height:auto;border-radius:14px;display:block;"><figcaption style="font-size:13px;color:#64748b;margin-top:8px;text-align:center;">Legenda da mídia</figcaption></figure>',
      },
      {
        id: 'divider',
        label: 'Divisor',
        icon: Minus,
        html: '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">',
      },
      {
        id: 'spacer',
        label: 'Espaço',
        icon: Square,
        html: '<div style="height:40px;"></div>',
      },
      {
        id: 'iconbox',
        label: 'Icon Box',
        icon: Star,
        html: '<div style="display:flex;gap:14px;align-items:flex-start;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;"><div style="width:40px;height:40px;border-radius:10px;background:#eef2ff;color:#6d71f0;display:flex;align-items:center;justify-content:center;font-weight:800;">★</div><div><h3 style="font-size:18px;margin:0 0 6px;">Recurso</h3><p style="margin:0;color:#64748b;line-height:1.5;">Descrição curta do recurso.</p></div></div>',
      },
    ],
  },
  {
    category: 'Estrutura',
    items: [
      {
        id: 'section',
        label: 'Seção',
        icon: Layout,
        html: '<section style="padding:60px 20px;background:#f9fafb;"><div style="max-width:1200px;margin:0 auto;"><h2 style="font-size:32px;margin-bottom:16px;">Nova seção</h2><p style="color:#6b7280;line-height:1.6;">Descrição da seção. Clique para editar.</p></div></section>',
      },
      {
        id: 'container',
        label: 'Container',
        icon: Square,
        html: '<div style="padding:24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb;"><p style="margin:0;">Conteúdo do container.</p></div>',
      },
      {
        id: 'columns2',
        label: '2 Colunas',
        icon: Layout,
        html: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:24px 0;"><div><h3 style="font-size:18px;margin-bottom:8px;">Coluna 1</h3><p style="color:#6b7280;">Conteúdo da primeira coluna.</p></div><div><h3 style="font-size:18px;margin-bottom:8px;">Coluna 2</h3><p style="color:#6b7280;">Conteúdo da segunda coluna.</p></div></div>',
      },
      {
        id: 'columns4',
        label: '4 Colunas',
        icon: Columns3,
        html: '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding:24px 0;"><div><h3 style="font-size:16px;margin-bottom:8px;">Item 1</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div><div><h3 style="font-size:16px;margin-bottom:8px;">Item 2</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div><div><h3 style="font-size:16px;margin-bottom:8px;">Item 3</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div><div><h3 style="font-size:16px;margin-bottom:8px;">Item 4</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div></div>',
      },
      {
        id: 'grid',
        label: 'Grid Cards',
        icon: Rows3,
        html: '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;padding:24px 0;"><div style="padding:22px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;"><h3 style="margin:0 0 8px;">Card 1</h3><p style="margin:0;color:#64748b;">Texto do card.</p></div><div style="padding:22px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;"><h3 style="margin:0 0 8px;">Card 2</h3><p style="margin:0;color:#64748b;">Texto do card.</p></div><div style="padding:22px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;"><h3 style="margin:0 0 8px;">Card 3</h3><p style="margin:0;color:#64748b;">Texto do card.</p></div></div>',
      },
      {
        id: 'columns3',
        label: '3 Colunas',
        icon: Layout,
        html: '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:24px 0;"><div><h3 style="font-size:16px;margin-bottom:8px;">Item 1</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div><div><h3 style="font-size:16px;margin-bottom:8px;">Item 2</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div><div><h3 style="font-size:16px;margin-bottom:8px;">Item 3</h3><p style="color:#6b7280;font-size:14px;">Descrição.</p></div></div>',
      },
      {
        id: 'list',
        label: 'Lista',
        icon: List,
        html: '<ul style="padding-left:20px;line-height:1.8;"><li>Primeiro item</li><li>Segundo item</li><li>Terceiro item</li></ul>',
      },
      {
        id: 'card',
        label: 'Card',
        icon: Square,
        html: '<div style="padding:32px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;box-shadow:0 4px 12px rgba(0,0,0,0.04);max-width:400px;"><h3 style="font-size:20px;margin-bottom:8px;">Título do card</h3><p style="color:#6b7280;line-height:1.5;margin-bottom:16px;">Texto descritivo do card.</p><a href="#" style="color:#6d71f0;font-weight:600;text-decoration:none;">Saiba mais →</a></div>',
      },
      {
        id: 'hero',
        label: 'Hero',
        icon: Layout,
        html: '<section style="padding:80px 24px;background:#f8fafc;"><div style="max-width:1100px;margin:0 auto;text-align:center;"><h1 style="font-size:52px;line-height:1.05;margin:0 0 18px;color:#0f172a;">Título principal</h1><p style="font-size:20px;line-height:1.6;color:#475569;margin:0 auto 28px;max-width:720px;">Descrição curta do produto ou oferta.</p><a href="#" style="display:inline-flex;padding:14px 24px;border-radius:999px;background:#6d71f0;color:#fff;text-decoration:none;font-weight:700;">Chamada principal</a></div></section>',
      },
      {
        id: 'form',
        label: 'Formulário',
        icon: Mail,
        html: '<form style="display:grid;gap:12px;max-width:520px;padding:24px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;"><input placeholder="Nome" style="padding:12px;border:1px solid #d1d5db;border-radius:8px;"><input placeholder="E-mail" type="email" style="padding:12px;border:1px solid #d1d5db;border-radius:8px;"><textarea placeholder="Mensagem" style="padding:12px;border:1px solid #d1d5db;border-radius:8px;min-height:120px;"></textarea><button style="padding:12px 18px;border:none;border-radius:8px;background:#6d71f0;color:#fff;font-weight:700;">Enviar</button></form>',
      },
      {
        id: 'map',
        label: 'Mapa',
        icon: MapPin,
        html: '<div style="height:320px;border-radius:16px;background:linear-gradient(135deg,#e5e7eb,#f8fafc);border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;color:#64748b;font-weight:700;">Mapa / localização</div>',
      },
    ],
  },
  {
    category: 'Avançado',
    items: [
      {
        id: 'html',
        label: 'HTML',
        icon: Code2,
        html: '<div><!-- HTML personalizado --></div>',
      },
    ],
  },
]

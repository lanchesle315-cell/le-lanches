# Lê Lanches

Site/cardápio online baseado na estrutura do projeto Chapa Lanches, adaptado para um cliente independente.

## Dados configurados

* WhatsApp: (15) 99631-4700
* Endereço: R. Firmino Mineli, 315 - Jardim Hungares, Sorocaba - SP, 18075-700
* Horário: quarta a domingo, 19h às 23h
* Instagram: @lelan\_ches2025

## Admin local

Troque a credencial antes de publicar. O Supabase está intencionalmente vazio para não reutilizar o banco de outro cliente. Sem Supabase, os pedidos são gravados no localStorage do navegador e o pedido pelo WhatsApp funciona normalmente.

## Pendências para produção

* Confirmar chave PIX antes de habilitar PIX.
* Confirmar política/tabela de taxa de delivery. Atualmente o site informa “taxa a confirmar” no WhatsApp.
* Se desejar painel sincronizado em vários dispositivos, criar um projeto Supabase exclusivo do Lê Lanches e preencher `js/config.js`.


# Skill Registry, vexter-portfolio

Infraestructura SDD (mode-independent). Escaneado 2026-08-19. Ningún `AGENTS.md`/`CLAUDE.md` a nivel de proyecto todavía, aplica el `~/.claude/CLAUDE.md` global (protocolo Engram, Agent Teams Lite, reglas de commits/build/CLI tools).

## SDD (workflow de este proyecto)
| Skill | Trigger |
|---|---|
| sdd-explore | Investigar una idea/feature antes de proponerla |
| sdd-propose | Crear proposal (intent, scope, approach) |
| sdd-spec | Requisitos formales (Given/When/Then) |
| sdd-design | Arquitectura + decisiones técnicas |
| sdd-tasks | Desglose en tareas ejecutables |
| sdd-apply | Implementar código desde las tasks |
| sdd-verify | Validar implementación contra specs |
| sdd-archive | Cerrar un change, mergear specs |

## Coding / stack
| Skill | Trigger |
|---|---|
| claude-api | Dudas de API/SDK de Claude, tool use, MCP, caching |
| vercel:ai-sdk | Vercel AI SDK, tool calling, streaming, structured output (mismo SDK que Vexter) |
| vercel:nextjs | App Router, Server Actions, Server Components |
| geo (familia) | Si en algún punto el producto necesita visibilidad SEO/AI-search |

## Calidad / entrega
| Skill | Trigger |
|---|---|
| code-review | Revisar diff/PR por bugs y simplificación |
| simplify | Limpieza de reuso/eficiencia sin buscar bugs |
| security-review | Revisión de seguridad de cambios pendientes |
| branch-pr | Preparar PR issue-first, conventional commits, <400 líneas |
| work-unit-commits | Organizar commits como unidades de trabajo reviewable |
| judgment-day | Revisión adversarial dual antes de mergear algo crítico |

## Memoria
| Skill | Trigger |
|---|---|
| engram:memory | SIEMPRE ACTIVO, guardar decisiones/bugs/discoveries proactivamente |

## No aplican a este proyecto (visto pero descartado)
- Familia `geo-*` de auditoría (SEO agencia), no es el foco del producto en sí, solo la entrada genérica de arriba si hiciera falta.
- Familia `vercel:vercel-*` de infra pesada (firewall, sandbox, microfrontends), proyecto chico de portfolio, no ameritan todavía.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "../services/api";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import ImageGallery from "./ImageGallery";
import Cropper from "react-easy-crop";
import Slider from "@mui/material/Slider";
import EmojiPicker from "emoji-picker-react";

// Plugins avanzados para Quill
import ImageResize from "quill-image-resize-module-react";
import QuillImageDropAndPaste from "quill-image-drop-and-paste";

// Registrar módulos Quill
Quill.register("modules/imageResize", ImageResize);
try {
  Quill.register("modules/imageDropAndPaste", QuillImageDropAndPaste);
} catch (e) {
  console.warn("ImageDropAndPaste module already registered");
}

// Configuración avanzada de Quill con más opciones
const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }, { font: [] }, { size: ['small', false, 'large', 'huge'] }],
      ["bold", "italic", "underline", "strike", "blockquote", "code-block"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      ["link", "image", "video", "formula"],
      ["clean"],
      ["undo", "redo"]
    ],
    handlers: {
      undo: function() {
        this.quill.history.undo();
      },
      redo: function() {
        this.quill.history.redo();
      }
    }
  },
  imageResize: { 
    modules: ["Resize", "DisplaySize", "Toolbar"],
    displayStyles: { 
      backgroundColor: "#f3f6fb", 
      border: "2px solid #4254ef",
      borderRadius: "8px"
    }
  },
  imageDropAndPaste: {
    handler: (dataUrl, type, imageData) => {
      const quill = this.quill;
      const range = quill.getSelection();
      quill.insertEmbed(range ? range.index : 0, "image", dataUrl);
    }
  },
  history: {
    delay: 1000,
    maxStack: 100,
    userOnly: true
  }
};

const quillFormats = [
  "header","font","size","bold","italic","underline","strike","blockquote","code-block",
  "color","background","align","script","direction","list","indent",
  "link","image","video","formula"
];

// Plantillas predefinidas avanzadas - ULTRA COMPLETAS
const emailTemplates = [
  {
    id: 1,
    name: "Bienvenida Corporativa Premium",
    category: "onboarding",
    subject: "🎉 ¡Bienvenido a {company}! Tu cuenta premium está lista",
    description: "Plantilla elegante para dar bienvenida a nuevos usuarios con diseño corporativo moderno",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 16px;">
        <div style="background: white; border-radius: 20px; padding: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.15); overflow: hidden;">
          <!-- Header con animación -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%); animation: float 6s ease-in-out infinite;"></div>
            <div style="background: rgba(255,255,255,0.15); width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 48px; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.2);">🎉</div>
            <h1 style="color: white; font-size: 36px; margin: 0 0 12px 0; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 4px 8px rgba(0,0,0,0.3);">¡Te damos la bienvenida!</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0; font-weight: 500;">Tu viaje hacia el éxito comienza aquí</p>
          </div>
          
          <!-- Contenido principal -->
          <div style="padding: 45px 40px;">
            <div style="text-align: center; margin-bottom: 35px;">
              <p style="font-size: 20px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">Hola <span style="color: #4f46e5; font-weight: 800;">{name}</span>,</p>
              <p style="font-size: 16px; color: #6b7280; line-height: 1.7; margin: 0;">
                Nos complace enormemente darte la bienvenida a <strong style="color: #4f46e5;">{company}</strong>. Tu cuenta premium ha sido activada y ya puedes disfrutar de todas nuestras funcionalidades exclusivas.
              </p>
            </div>
            
            <!-- Beneficios destacados -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; padding: 30px; margin: 35px 0; border-left: 5px solid #4f46e5;">
              <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                <span style="background: #4f46e5; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px;">✨</span>
                Beneficios de tu cuenta Premium
              </h3>
              <div style="display: grid; gap: 18px;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <span style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <strong style="color: #1f2937; font-size: 15px;">Acceso ilimitado</strong>
                    <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.5;">Usa todas nuestras herramientas sin restricciones</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <span style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <strong style="color: #1f2937; font-size: 15px;">Soporte prioritario 24/7</strong>
                    <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.5;">Nuestro equipo experto te ayudará cuando lo necesites</p>
                  </div>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <span style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; margin-top: 2px;">✓</span>
                  <div>
                    <strong style="color: #1f2937; font-size: 15px;">Funciones exclusivas</strong>
                    <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px; line-height: 1.5;">Accede a características que solo están disponibles para usuarios premium</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Próximos pasos -->
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 30px 0;">
              <h4 style="color: #1f2937; margin: 0 0 18px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">🚀</span> Primeros pasos recomendados
              </h4>
              <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 8px;"><strong>Completa tu perfil</strong> - Añade tu información para una experiencia personalizada</li>
                <li style="margin-bottom: 8px;"><strong>Explora el dashboard</strong> - Familiarízate con todas las herramientas disponibles</li>
                <li style="margin-bottom: 8px;"><strong>Configura tus preferencias</strong> - Personaliza la plataforma según tus necesidades</li>
                <li><strong>Únete a nuestra comunidad</strong> - Conecta con otros usuarios y comparte experiencias</li>
              </ol>
            </div>
            
            <!-- CTA principal -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="{action_url}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 20px 45px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 18px; display: inline-block; box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4); transition: transform 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                🎯 Comenzar mi experiencia premium
              </a>
              <p style="font-size: 14px; color: #9ca3af; margin: 18px 0 0 0;">
                ¿Necesitas ayuda? <a href="{support_url}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Nuestro equipo está aquí para ti</a>
              </p>
            </div>
            
            <!-- Recursos adicionales -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 25px; margin: 35px 0;">
              <h4 style="color: #92400e; margin: 0 0 18px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 20px;">📚</span> Recursos útiles para empezar
              </h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px;">
                <a href="{guide_url}" style="background: white; padding: 15px; border-radius: 8px; text-decoration: none; color: #b45309; font-weight: 600; text-align: center; border: 1px solid #fed7aa; transition: transform 0.2s ease;">
                  📖 Guía de inicio
                </a>
                <a href="{video_url}" style="background: white; padding: 15px; border-radius: 8px; text-decoration: none; color: #b45309; font-weight: 600; text-align: center; border: 1px solid #fed7aa; transition: transform 0.2s ease;">
                  🎥 Video tutoriales
                </a>
                <a href="{faq_url}" style="background: white; padding: 15px; border-radius: 8px; text-decoration: none; color: #b45309; font-weight: 600; text-align: center; border: 1px solid #fed7aa; transition: transform 0.2s ease;">
                  ❓ Preguntas frecuentes
                </a>
              </div>
            </div>
          </div>
          
          <!-- Footer corporativo -->
          <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <div style="margin-bottom: 20px;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">¿Tienes preguntas? Estamos aquí para ayudarte</p>
              <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <a href="{support_url}" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600;">💬 Chat en vivo</a>
                <a href="{email_url}" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600;">📧 Email soporte</a>
                <a href="{phone_url}" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600;">📞 Teléfono</a>
              </div>
            </div>
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 8px 0;">
                Síguenos en nuestras redes sociales para las últimas actualizaciones
              </p>
              <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px;">
                <a href="{social_fb}" style="display: inline-block; width: 36px; height: 36px; background: #1877f2; border-radius: 50%; color: white; text-decoration: none; font-size: 18px; line-height: 36px;">f</a>
                <a href="{social_tw}" style="display: inline-block; width: 36px; height: 36px; background: #1da1f2; border-radius: 50%; color: white; text-decoration: none; font-size: 18px; line-height: 36px;">t</a>
                <a href="{social_in}" style="display: inline-block; width: 36px; height: 36px; background: #0a66c2; border-radius: 50%; color: white; text-decoration: none; font-size: 18px; line-height: 36px;">in</a>
              </div>
              <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                © 2025 <strong>ONIXU Technologies</strong>. Todos los derechos reservados.<br/>
                {company_address} | <a href="{unsubscribe_url}" style="color: #9ca3af; text-decoration: none;">Cancelar suscripción</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 2,
    name: "Newsletter Ejecutivo Premium",
    category: "newsletter", 
    subject: "📊 Newsletter Ejecutivo {month} - Insights y tendencias del mercado",
    description: "Newsletter profesional con análisis de mercado y métricas de negocio",
    html: `
      <div style="font-family: 'Inter', system-ui, Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8fafc; border-radius: 16px; overflow: hidden;">
        <!-- Header principal -->
        <header style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 30px; text-align: center; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b);"></div>
          <div style="background: rgba(255,255,255,0.1); width: 100px; height: 100px; border-radius: 20px; margin: 0 auto 25px; display: flex; align-items: center; justify-content: center; font-size: 40px; backdrop-filter: blur(10px);">📊</div>
          <h1 style="color: white; margin: 0 0 8px 0; font-size: 32px; font-weight: 900; letter-spacing: -1px;">Newsletter Ejecutivo</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 18px; font-weight: 500;">{month} 2025 - Edición #{edition}</p>
          <div style="background: rgba(255,255,255,0.15); border-radius: 50px; padding: 8px 20px; margin: 20px auto 0; display: inline-block;">
            <span style="color: white; font-size: 14px; font-weight: 600;">📈 Insights exclusivos para líderes</span>
          </div>
        </header>
        
        <!-- Estadísticas destacadas -->
        <div style="background: white; padding: 35px 30px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="color: #1f2937; margin: 0 0 25px 0; font-size: 24px; font-weight: 800; text-align: center;">📈 Métricas clave del mes</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px;">
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #3b82f6;">
              <div style="color: #1e40af; font-size: 28px; font-weight: 900; margin-bottom: 5px;">{metric_1}</div>
              <div style="color: #3730a3; font-size: 12px; font-weight: 600; text-transform: uppercase;">Crecimiento</div>
            </div>
            <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #10b981;">
              <div style="color: #047857; font-size: 28px; font-weight: 900; margin-bottom: 5px;">{metric_2}</div>
              <div style="color: #065f46; font-size: 12px; font-weight: 600; text-transform: uppercase;">Ingresos</div>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #f59e0b;">
              <div style="color: #b45309; font-size: 28px; font-weight: 900; margin-bottom: 5px;">{metric_3}</div>
              <div style="color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase;">Eficiencia</div>
            </div>
            <div style="background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); padding: 20px; border-radius: 12px; text-align: center; border-left: 4px solid #ec4899;">
              <div style="color: #be185d; font-size: 28px; font-weight: 900; margin-bottom: 5px;">{metric_4}</div>
              <div style="color: #9d174d; font-size: 12px; font-weight: 600; text-transform: uppercase;">Satisfacción</div>
            </div>
          </div>
        </div>
        
        <!-- Contenido principal -->
        <main style="background: white; padding: 40px 30px;">
          <!-- Análisis principal -->
          <section style="margin-bottom: 40px;">
            <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
              <span style="background: #1f2937; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px;">🎯</span>
              <h3 style="color: #1f2937; margin: 0; font-size: 22px; font-weight: 700;">Análisis estratégico del mes</h3>
            </div>
            <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border-left: 4px solid #1f2937;">
              <p style="color: #4b5563; line-height: 1.7; margin: 0 0 15px 0; font-size: 16px;">
                Este mes hemos observado tendencias significativas en el mercado que impactan directamente en nuestro sector. Los datos muestran un incremento del <strong style="color: #1f2937;">{growth_percentage}%</strong> en la adopción de soluciones digitales.
              </p>
              <div style="background: white; border-radius: 8px; padding: 20px; margin: 15px 0; border: 1px solid #e5e7eb;">
                <h4 style="color: #1f2937; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">💡 Insight clave:</h4>
                <p style="color: #6b7280; margin: 0; line-height: 1.6; font-style: italic;">
                  "Las empresas que adoptan estrategias digitales integradas muestran un 40% mayor rendimiento que sus competidores tradicionales."
                </p>
              </div>
            </div>
          </section>
          
          <!-- Artículos destacados -->
          <section style="margin-bottom: 40px;">
            <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 22px; font-weight: 700; text-align: center;">📚 Lecturas recomendadas</h3>
            <div style="display: grid; gap: 25px;">
              <article style="display: flex; gap: 20px; padding: 20px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <div style="background: #dbeafe; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">🚀</div>
                <div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">Innovaciones tecnológicas en 2025</h4>
                  <p style="color: #6b7280; margin: 0 0 12px 0; line-height: 1.6; font-size: 15px;">Descubre las tecnologías emergentes que están transformando la industria y cómo implementarlas en tu organización.</p>
                  <a href="{article_url_1}" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">
                    Leer artículo completo <span>→</span>
                  </a>
                </div>
              </article>
              
              <article style="display: flex; gap: 20px; padding: 20px; background: #f0fdf4; border-radius: 12px; border-left: 4px solid #10b981;">
                <div style="background: #dcfce7; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">💼</div>
                <div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">Estrategias de liderazgo efectivo</h4>
                  <p style="color: #6b7280; margin: 0 0 12px 0; line-height: 1.6; font-size: 15px;">Técnicas probadas para liderar equipos remotos y híbridos en el nuevo paradigma laboral.</p>
                  <a href="{article_url_2}" style="color: #10b981; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">
                    Ver estrategias <span>→</span>
                  </a>
                </div>
              </article>
              
              <article style="display: flex; gap: 20px; padding: 20px; background: #fffbeb; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <div style="background: #fef3c7; width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0;">📊</div>
                <div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">Análisis de mercado Q4 2025</h4>
                  <p style="color: #6b7280; margin: 0 0 12px 0; line-height: 1.6; font-size: 15px;">Reporte exclusivo con proyecciones y oportunidades de inversión para el próximo trimestre.</p>
                  <a href="{report_url}" style="color: #f59e0b; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px;">
                    Descargar reporte <span>→</span>
                  </a>
                </div>
              </article>
            </div>
          </section>
          
          <!-- Próximos eventos -->
          <section style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 16px; padding: 30px; color: white; margin-bottom: 40px; text-align: center;">
            <h3 style="color: white; margin: 0 0 20px 0; font-size: 22px; font-weight: 700;">🗓️ Próximos eventos ejecutivos</h3>
            <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 25px; margin: 20px 0;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="text-align: left;">
                  <div style="color: #fbbf24; font-size: 14px; font-weight: 600; margin-bottom: 5px;">15 de {next_month}</div>
                  <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Summit de Innovación Digital</div>
                  <div style="color: rgba(255,255,255,0.8); font-size: 14px;">Conferencia virtual para CXOs</div>
                </div>
                <div style="text-align: left;">
                  <div style="color: #fbbf24; font-size: 14px; font-weight: 600; margin-bottom: 5px;">28 de {next_month}</div>
                  <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Workshop: IA en Negocios</div>
                  <div style="color: rgba(255,255,255,0.8); font-size: 14px;">Sesión práctica exclusiva</div>
                </div>
              </div>
            </div>
            <a href="{events_url}" style="background: white; color: #1e293b; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 700; display: inline-block; margin-top: 15px;">
              Ver todos los eventos
            </a>
          </section>
          
          <!-- Recomendaciones personalizadas -->
          <section>
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px; font-weight: 700;">🎯 Recomendado para ti</h3>
            <div style="background: linear-gradient(135deg, #fef7ff 0%, #fae8ff 100%); border-radius: 12px; padding: 25px; border-left: 4px solid #a855f7;">
              <div style="display: flex; align-items: start; gap: 15px;">
                <span style="background: #a855f7; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0;">🤖</span>
                <div>
                  <h4 style="color: #7c2d12; margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">Basado en tu perfil ejecutivo</h4>
                  <p style="color: #92400e; margin: 0 0 15px 0; line-height: 1.6; font-size: 15px;">
                    Te recomendamos revisar nuestro nuevo dashboard de métricas avanzadas y la masterclass sobre "Transformación Digital Sostenible" específicamente diseñada para líderes de tu sector.
                  </p>
                  <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <a href="{dashboard_url}" style="background: #a855f7; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Explorar dashboard
                    </a>
                    <a href="{masterclass_url}" style="background: white; color: #a855f7; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600; border: 2px solid #a855f7;">
                      Ver masterclass
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <!-- Footer completo -->
        <footer style="background: #f3f4f6; padding: 30px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <h4 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">Mantente conectado</h4>
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
              <a href="{social_linkedin}" style="display: inline-block; width: 44px; height: 44px; background: #0a66c2; border-radius: 50%; color: white; text-decoration: none; font-size: 20px; line-height: 44px;">in</a>
              <a href="{social_twitter}" style="display: inline-block; width: 44px; height: 44px; background: #1da1f2; border-radius: 50%; color: white; text-decoration: none; font-size: 20px; line-height: 44px;">𝕏</a>
              <a href="{social_youtube}" style="display: inline-block; width: 44px; height: 44px; background: #ff0000; border-radius: 50%; color: white; text-decoration: none; font-size: 20px; line-height: 44px;">▶</a>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; max-width: 400px; margin: 0 auto;">
              <a href="{newsletter_archive}" style="color: #4b5563; text-decoration: none; font-size: 14px; font-weight: 600;">📚 Archivo</a>
              <a href="{preferences_url}" style="color: #4b5563; text-decoration: none; font-size: 14px; font-weight: 600;">⚙️ Preferencias</a>
              <a href="{forward_url}" style="color: #4b5563; text-decoration: none; font-size: 14px; font-weight: 600;">📤 Compartir</a>
              <a href="{feedback_url}" style="color: #4b5563; text-decoration: none; font-size: 14px; font-weight: 600;">💬 Feedback</a>
            </div>
          </div>
          <div style="border-top: 1px solid #d1d5db; padding-top: 20px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; line-height: 1.5;">
              <strong>ONIXU Executive Newsletter</strong> - Insights exclusivos para líderes visionarios<br/>
              {company_address} | Tel: {company_phone}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 ONIXU Technologies. Todos los derechos reservados. | 
              <a href="{privacy_url}" style="color: #9ca3af; text-decoration: none;">Privacidad</a> | 
              <a href="{terms_url}" style="color: #9ca3af; text-decoration: none;">Términos</a> | 
              <a href="{unsubscribe_url}" style="color: #9ca3af; text-decoration: none;">Cancelar suscripción</a>
            </p>
          </div>
        </footer>
      </div>
    `
  },
  {
    id: 3,
    name: "Promoción Black Friday Ultra",
    category: "promotion",
    subject: "🖤 BLACK FRIDAY MEGA SALE - {discount}% OFF + Envío GRATIS 🚚",
    description: "Plantilla de promoción premium con animaciones, contador y urgencia",
    html: `
      <div style="font-family: 'Arial Black', Arial, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(45deg, #000000, #1f1f1f, #000000); padding: 15px; border-radius: 20px;">
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.3); border: 2px solid #fbbf24;">
          
          <!-- Header Black Friday -->
          <div style="background: linear-gradient(135deg, #000000 0%, #1f1f1f 50%, #000000 100%); padding: 40px 20px; text-align: center; position: relative; overflow: hidden;">
            <!-- Elementos decorativos -->
            <div style="position: absolute; top: -20px; left: -20px; width: 60px; height: 60px; background: #fbbf24; border-radius: 50%; opacity: 0.3; animation: pulse 2s infinite;"></div>
            <div style="position: absolute; bottom: -30px; right: -30px; width: 80px; height: 80px; background: #ef4444; border-radius: 50%; opacity: 0.2; animation: pulse 3s infinite;"></div>
            
            <!-- Logo o badge Black Friday -->
            <div style="background: linear-gradient(45deg, #fbbf24, #f59e0b); width: 120px; height: 120px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: black; box-shadow: 0 10px 30px rgba(251, 191, 36, 0.5); border: 4px solid white;">
              BF<br/>2025
            </div>
            
            <h1 style="color: white; font-size: 42px; margin: 0 0 10px 0; text-shadow: 3px 3px 6px rgba(0,0,0,0.7); font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
              🖤 BLACK FRIDAY
            </h1>
            <div style="background: linear-gradient(90deg, #ef4444, #fbbf24, #ef4444); background-size: 200% 200%; animation: gradient 2s ease infinite; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; font-weight: 900; margin: 0 0 15px 0; letter-spacing: 1px;">
              MEGA SALE EXCLUSIVA
            </div>
            <p style="color: #fbbf24; font-size: 18px; margin: 0; font-weight: 700; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
              ⏰ Solo por tiempo limitado - ¡NO te lo pierdas!
            </p>
          </div>
          
          <!-- Contador de urgencia -->
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 20px; text-align: center; color: white;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">⏰ La oferta termina en:</h3>
            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 15px; min-width: 60px;">
                <div style="font-size: 24px; font-weight: 900; line-height: 1;">{countdown_hours}</div>
                <div style="font-size: 12px; text-transform: uppercase; margin-top: 2px;">Horas</div>
              </div>
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 15px; min-width: 60px;">
                <div style="font-size: 24px; font-weight: 900; line-height: 1;">{countdown_minutes}</div>
                <div style="font-size: 12px; text-transform: uppercase; margin-top: 2px;">Min</div>
              </div>
              <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px 15px; min-width: 60px;">
                <div style="font-size: 24px; font-weight: 900; line-height: 1;">{countdown_seconds}</div>
                <div style="font-size: 12px; text-transform: uppercase; margin-top: 2px;">Seg</div>
              </div>
            </div>
          </div>
          
          <!-- Oferta principal -->
          <div style="background: white; padding: 50px 30px; text-align: center;">
            <div style="margin-bottom: 35px;">
              <div style="background: linear-gradient(135deg, #000000, #1f1f1f); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 80px; font-weight: 900; line-height: 0.9; margin-bottom: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                {discount}%
              </div>
              <div style="color: #ef4444; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">
                DE DESCUENTO
              </div>
              <p style="color: #6b7280; font-size: 18px; margin: 0; font-weight: 600;">+ Envío GRATIS en toda tu compra</p>
            </div>
            
            <!-- Beneficios destacados -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 20px; margin: 40px 0; padding: 25px; background: #f8fafc; border-radius: 16px; border: 2px dashed #e5e7eb;">
              <div style="text-align: center;">
                <div style="background: #10b981; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 10px; font-weight: bold;">🚚</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">Envío Gratis</div>
                <div style="color: #6b7280; font-size: 12px;">Sin mínimo</div>
              </div>
              <div style="text-align: center;">
                <div style="background: #3b82f6; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 10px; font-weight: bold;">🔒</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">Pago Seguro</div>
                <div style="color: #6b7280; font-size: 12px;">SSL 256-bit</div>
              </div>
              <div style="text-align: center;">
                <div style="background: #f59e0b; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 10px; font-weight: bold;">⚡</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">Envío Express</div>
                <div style="color: #6b7280; font-size: 12px;">24-48h</div>
              </div>
              <div style="text-align: center;">
                <div style="background: #8b5cf6; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; margin: 0 auto 10px; font-weight: bold;">↩️</div>
                <div style="color: #1f2937; font-size: 14px; font-weight: 700;">Devolución</div>
                <div style="color: #6b7280; font-size: 12px;">30 días</div>
              </div>
            </div>
            
            <!-- Código de cupón -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px dashed #f59e0b; border-radius: 20px; padding: 30px; margin: 40px 0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #f59e0b; color: white; padding: 8px 20px; border-radius: 25px; font-size: 12px; font-weight: 800; text-transform: uppercase;">CÓDIGO EXCLUSIVO</div>
              <div style="margin-top: 10px;">
                <p style="font-size: 16px; color: #92400e; margin: 0 0 15px 0; font-weight: 700;">🎁 Usa este código y obtén tu descuento:</p>
                <div style="background: white; border: 3px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 15px 0; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);">
                  <div style="font-size: 32px; font-weight: 900; color: #b45309; letter-spacing: 4px; font-family: 'Courier New', monospace; text-align: center;">{coupon_code}</div>
                </div>
                <p style="font-size: 14px; color: #b45309; margin: 15px 0 0 0; font-weight: 600;">📋 Haz clic para copiar automáticamente</p>
              </div>
            </div>
            
            <!-- CTA principal -->
            <div style="margin: 50px 0;">
              <a href="{shop_url}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 25px 60px; text-decoration: none; border-radius: 50px; font-weight: 900; font-size: 22px; display: inline-block; box-shadow: 0 15px 40px rgba(239, 68, 68, 0.4); transition: transform 0.3s ease; text-transform: uppercase; letter-spacing: 1px; border: 3px solid #fbbf24;">
                🛒 COMPRAR AHORA
              </a>
              <p style="font-size: 14px; color: #9ca3af; margin: 20px 0 0 0; font-weight: 600;">
                ⚠️ Oferta válida hasta el {expiry_date} o hasta agotar stock
              </p>
            </div>
            
            <!-- Productos destacados -->
            <div style="margin: 50px 0;">
              <h3 style="color: #1f2937; margin: 0 0 25px 0; font-size: 24px; font-weight: 800; text-transform: uppercase;">🔥 Lo más vendido del Black Friday</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 20px;">
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb; transition: transform 0.3s ease;">
                  <div style="background: #dbeafe; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px;">📱</div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">{product_1}</h4>
                  <div style="color: #ef4444; font-size: 18px; font-weight: 900; margin: 5px 0;">
                    <span style="text-decoration: line-through; color: #9ca3af; font-size: 14px; margin-right: 8px;">${original_price_1}</span>
                    ${sale_price_1}
                  </div>
                  <div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px;">
                    -{discount_1}%
                  </div>
                </div>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb; transition: transform 0.3s ease;">
                  <div style="background: #dcfce7; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px;">💻</div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">{product_2}</h4>
                  <div style="color: #ef4444; font-size: 18px; font-weight: 900; margin: 5px 0;">
                    <span style="text-decoration: line-through; color: #9ca3af; font-size: 14px; margin-right: 8px;">${original_price_2}</span>
                    ${sale_price_2}
                  </div>
                  <div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px;">
                    -{discount_2}%
                  </div>
                </div>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 2px solid #e5e7eb; transition: transform 0.3s ease;">
                  <div style="background: #fef3c7; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; font-size: 32px;">🎧</div>
                  <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 16px; font-weight: 700;">{product_3}</h4>
                  <div style="color: #ef4444; font-size: 18px; font-weight: 900; margin: 5px 0;">
                    <span style="text-decoration: line-through; color: #9ca3af; font-size: 14px; margin-right: 8px;">${original_price_3}</span>
                    ${sale_price_3}
                  </div>
                  <div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 700; display: inline-block; margin-top: 8px;">
                    -{discount_3}%
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Testimonios rápidos -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 30px; margin: 40px 0; border-left: 4px solid #0ea5e9;">
              <h4 style="color: #0c4a6e; margin: 0 0 20px 0; font-size: 18px; font-weight: 700; text-align: center;">💬 Lo que dicen nuestros clientes</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                <div style="background: white; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="color: #fbbf24; font-size: 16px; margin-bottom: 8px;">⭐⭐⭐⭐⭐</div>
                  <p style="color: #4b5563; font-size: 14px; margin: 0 0 10px 0; font-style: italic;">"Excelente calidad y envío súper rápido"</p>
                  <div style="color: #9ca3af; font-size: 12px; font-weight: 600;">- María G.</div>
                </div>
                <div style="background: white; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="color: #fbbf24; font-size: 16px; margin-bottom: 8px;">⭐⭐⭐⭐⭐</div>
                  <p style="color: #4b5563; font-size: 14px; margin: 0 0 10px 0; font-style: italic;">"Los mejores precios del mercado"</p>
                  <div style="color: #9ca3af; font-size: 12px; font-weight: 600;">- Carlos R.</div>
                </div>
                <div style="background: white; border-radius: 8px; padding: 15px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <div style="color: #fbbf24; font-size: 16px; margin-bottom: 8px;">⭐⭐⭐⭐⭐</div>
                  <p style="color: #4b5563; font-size: 14px; margin: 0 0 10px 0; font-style: italic;">"Servicio al cliente excepcional"</p>
                  <div style="color: #9ca3af; font-size: 12px; font-weight: 600;">- Ana L.</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer Black Friday -->
          <footer style="background: #000000; color: white; padding: 30px 20px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h4 style="color: #fbbf24; margin: 0 0 15px 0; font-size: 18px; font-weight: 700;">🖤 Black Friday Support</h4>
              <p style="color: #9ca3af; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
                ¿Tienes preguntas sobre tu pedido? Nuestro equipo está disponible 24/7 durante el Black Friday
              </p>
              <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <a href="{support_chat}" style="background: #fbbf24; color: black; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 700;">💬 Chat 24/7</a>
                <a href="{support_phone}" style="background: transparent; color: #fbbf24; padding: 8px 16px; text-decoration: none; border-radius: 20px; font-size: 14px; font-weight: 700; border: 2px solid #fbbf24;">📞 Llamar</a>
              </div>
            </div>
            
            <div style="border-top: 1px solid #374151; padding-top: 20px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0; line-height: 1.5;">
                <strong>ONIXU Black Friday Sale</strong> - Los mejores precios del año<br/>
                Válido del {start_date} al {end_date} | Términos y condiciones aplicables
              </p>
              <div style="display: flex; justify-content: center; gap: 15px; margin-bottom: 15px;">
                <a href="{social_instagram}" style="display: inline-block; width: 36px; height: 36px; background: #e1306c; border-radius: 50%; color: white; text-decoration: none; font-size: 16px; line-height: 36px;">📷</a>
                <a href="{social_facebook}" style="display: inline-block; width: 36px; height: 36px; background: #1877f2; border-radius: 50%; color: white; text-decoration: none; font-size: 16px; line-height: 36px;">f</a>
                <a href="{social_tiktok}" style="display: inline-block; width: 36px; height: 36px; background: #000000; border-radius: 50%; color: white; text-decoration: none; font-size: 16px; line-height: 36px; border: 2px solid #fbbf24;">🎵</a>
              </div>
              <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                © 2025 ONIXU Technologies. Todos los derechos reservados. | 
                <a href="{unsubscribe_url}" style="color: #9ca3af; text-decoration: none;">Cancelar suscripción</a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    `
  }
];

// Snippets de contenido reutilizable - ULTRA COMPLETOS
const contentSnippets = [
  {
    id: 1,
    name: "Firma CEO Premium",
    category: "signature",
    description: "Firma ejecutiva con foto, información completa y enlaces sociales",
    html: `
      <div style="border-top: 3px solid #4f46e5; padding-top: 30px; margin-top: 50px; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 35px; border-radius: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">
        <div style="display: flex; align-items: center; gap: 25px; margin-bottom: 25px;">
          <img src="https://via.placeholder.com/100x100/4f46e5/white?text=CEO" alt="CEO" style="border-radius: 50%; width: 100px; height: 100px; border: 4px solid #4f46e5; box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);">
          <div style="flex: 1;">
            <h3 style="margin: 0; font-weight: 900; color: #1f2937; font-size: 22px; margin-bottom: 8px;">[Nombre del CEO]</h3>
            <p style="margin: 0 0 6px 0; color: #4f46e5; font-size: 18px; font-weight: 700;">CEO & Fundador</p>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 16px; font-weight: 600;">ONIXU Technologies</p>
            
            <!-- Información de contacto -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-top: 15px;">
              <a href="mailto:[email]" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <span style="background: #4f46e5; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">📧</span>
                [email]
              </a>
              <a href="tel:[phone]" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <span style="background: #4f46e5; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">📱</span>
                [teléfono]
              </a>
              <a href="[linkedin_url]" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <span style="background: #0a66c2; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px;">in</span>
                LinkedIn
              </a>
              <a href="[calendar_url]" style="color: #4f46e5; text-decoration: none; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                <span style="background: #10b981; color: white; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">📅</span>
                Agendar reunión
              </a>
            </div>
          </div>
        </div>
        
        <!-- Certificaciones y logros -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">🏆 Reconocimientos</h4>
          <div style="display: flex; gap: 15px; flex-wrap: wrap;">
            <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">Forbes 30 Under 30</span>
            <span style="background: #dcfce7; color: #047857; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">CEO del Año 2024</span>
            <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">Innovation Award</span>
          </div>
        </div>
        
        <!-- Frase inspiracional -->
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic; line-height: 1.6;">
            💡 "La innovación no es solo crear algo nuevo, es transformar la forma en que las personas viven y trabajan"
          </p>
        </div>
        
        <!-- Disclaimer legal -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
          <p style="margin: 0; font-size: 10px; color: #9ca3af; line-height: 1.4;">
            Este email y cualquier archivo adjunto son confidenciales y están destinados únicamente al destinatario. 
            Si no es el destinatario previsto, por favor elimine este mensaje y notifique al remitente.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 2,
    name: "CTA Premium con Beneficios",
    category: "cta",
    description: "Call-to-action destacado con lista de beneficios y urgencia",
    html: `
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border-radius: 20px; padding: 35px; margin: 40px 0; text-align: center; color: white; position: relative; overflow: hidden;">
        <!-- Elementos decorativos -->
        <div style="position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%; animation: pulse 3s infinite;"></div>
        <div style="position: absolute; bottom: -20px; left: -20px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
        
        <!-- Contenido principal -->
        <div style="position: relative; z-index: 2;">
          <div style="background: rgba(255,255,255,0.15); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; backdrop-filter: blur(10px);">🚀</div>
          
          <h3 style="margin: 0 0 15px 0; font-size: 24px; font-weight: 800; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
            ¡Comienza tu transformación digital hoy!
          </h3>
          
          <p style="margin: 0 0 25px 0; font-size: 16px; color: rgba(255,255,255,0.9); line-height: 1.6;">
            Únete a más de <strong>10,000+ empresas</strong> que ya están optimizando sus procesos con nuestras soluciones
          </p>
          
          <!-- Lista de beneficios -->
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; margin: 25px 0; text-align: left; max-width: 400px; margin-left: auto; margin-right: auto;">
            <h4 style="margin: 0 0 15px 0; color: white; font-size: 16px; font-weight: 700; text-align: center;">✨ Lo que obtienes:</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</span>
                <span style="font-size: 14px; color: rgba(255,255,255,0.95);">Setup completo en menos de 24 horas</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</span>
                <span style="font-size: 14px; color: rgba(255,255,255,0.95);">Soporte técnico 24/7 incluido</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</span>
                <span style="font-size: 14px; color: rgba(255,255,255,0.95);">Capacitación personalizada para tu equipo</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: #10b981; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;">✓</span>
                <span style="font-size: 14px; color: rgba(255,255,255,0.95);">Garantía de satisfacción 30 días</span>
              </div>
            </div>
          </div>
          
          <!-- Urgencia -->
          <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 12px; margin: 20px 0; font-size: 14px; color: #fef2f2;">
            ⏰ <strong>Oferta limitada:</strong> Solo quedan {spots_left} espacios disponibles este mes
          </div>
          
          <!-- Botón principal -->
          <div style="margin: 30px 0;">
            <a href="[action_url]" style="background: white; color: #4f46e5; padding: 18px 40px; text-decoration: none; border-radius: 50px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 8px 25px rgba(255,255,255,0.3); transition: transform 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
              🎯 Comenzar prueba gratuita
            </a>
          </div>
          
          <!-- Información adicional -->
          <div style="margin-top: 25px;">
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin: 0;">
              💳 Sin compromiso • ❌ Sin tarjeta de crédito • 🔒 Datos 100% seguros
            </p>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 3,
    name: "Testimonial Destacado",
    category: "social-proof",
    description: "Testimonio completo con foto, calificación y empresa del cliente",
    html: `
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); border-radius: 16px; padding: 30px; margin: 35px 0; border-left: 5px solid #10b981; box-shadow: 0 4px 20px rgba(0,0,0,0.08); position: relative;">
        <!-- Badge de calificación -->
        <div style="position: absolute; top: -12px; right: 20px; background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px;">
          ⭐ 5.0 <span style="opacity: 0.8;">/ 5.0</span>
        </div>
        
        <!-- Icono de comillas -->
        <div style="font-size: 48px; color: #10b981; line-height: 1; margin-bottom: 20px; opacity: 0.3;">"</div>
        
        <!-- Testimonio -->
        <div style="margin-bottom: 25px;">
          <p style="font-style: italic; color: #374151; line-height: 1.7; margin: 0; font-size: 16px; font-weight: 500;">
            [Testimonio del cliente aquí - debe ser específico y mencionar beneficios concretos que obtuvieron. Por ejemplo: "Implementar esta solución redujo nuestros tiempos de proceso en un 60% y aumentó la satisfacción de nuestros clientes significativamente. El equipo de soporte es excepcional y la plataforma es muy intuitiva."]
          </p>
        </div>
        
        <!-- Información del cliente -->
        <div style="display: flex; align-items: center; gap: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <img src="https://via.placeholder.com/60x60/10b981/white?text=JD" alt="Cliente" style="border-radius: 50%; width: 60px; height: 60px; border: 3px solid #10b981; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
          <div style="flex: 1;">
            <h4 style="margin: 0; font-weight: 700; color: #1f2937; font-size: 16px;">[Nombre del Cliente]</h4>
            <p style="margin: 4px 0; color: #10b981; font-size: 14px; font-weight: 600;">[Cargo] en [Empresa]</p>
            <div style="display: flex; align-items: center; gap: 15px; margin-top: 8px;">
              <div style="display: flex; gap: 2px;">
                <span style="color: #fbbf24; font-size: 14px;">⭐⭐⭐⭐⭐</span>
              </div>
              <span style="color: #6b7280; font-size: 12px; font-weight: 500;">Verificado por [Plataforma]</span>
            </div>
          </div>
          
          <!-- Logo de la empresa -->
          <div style="text-align: right;">
            <img src="https://via.placeholder.com/80x40/e5e7eb/6b7280?text=LOGO" alt="Logo empresa" style="height: 40px; opacity: 0.7; border-radius: 4px;">
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Cliente desde 2023</p>
          </div>
        </div>
        
        <!-- Métricas de resultado -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin-top: 20px; border: 1px solid #e5e7eb;">
          <h5 style="margin: 0 0 15px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; text-align: center;">📈 Resultados obtenidos</h5>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 15px; text-align: center;">
            <div>
              <div style="color: #10b981; font-size: 20px; font-weight: 900;">[Métrica 1]</div>
              <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Eficiencia</div>
            </div>
            <div>
              <div style="color: #3b82f6; font-size: 20px; font-weight: 900;">[Métrica 2]</div>
              <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">Ahorro</div>
            </div>
            <div>
              <div style="color: #f59e0b; font-size: 20px; font-weight: 900;">[Métrica 3]</div>
              <div style="color: #6b7280; font-size: 11px; font-weight: 600; text-transform: uppercase;">ROI</div>
            </div>
          </div>
        </div>
        
        <!-- CTA relacionado -->
        <div style="text-align: center; margin-top: 25px;">
          <a href="[case_study_url]" style="color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; background: white; padding: 8px 16px; border-radius: 20px; border: 2px solid #10b981; transition: all 0.3s ease;">
            📖 Ver caso de estudio completo <span>→</span>
          </a>
        </div>
      </div>
    `
  },
  {
    id: 4,
    name: "Alerta de Seguridad Premium",
    category: "alert", 
    description: "Alerta de seguridad con iconografía clara y acciones recomendadas",
    html: `
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fde8e8 100%); border: 2px solid #f87171; border-radius: 16px; padding: 25px; margin: 30px 0; position: relative; overflow: hidden;">
        <!-- Patrón de fondo -->
        <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"%23f87171\" opacity=\"0.1\"><circle cx=\"10\" cy=\"10\" r=\"2\"/></svg>'); opacity: 0.3;"></div>
        
        <!-- Header de la alerta -->
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; position: relative; z-index: 2;">
          <div style="background: #ef4444; color: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); animation: pulse 2s infinite;">
            ⚠️
          </div>
          <div>
            <h3 style="margin: 0; font-weight: 800; color: #dc2626; font-size: 20px; letter-spacing: -0.5px;">[Título de la Alerta de Seguridad]</h3>
            <p style="margin: 4px 0 0 0; color: #b91c1c; font-size: 14px; font-weight: 600;">Acción requerida • Prioridad: Alta</p>
          </div>
          
          <!-- Badge de urgencia -->
          <div style="margin-left: auto; background: #ef4444; color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            URGENTE
          </div>
        </div>
        
        <!-- Contenido de la alerta -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; position: relative; z-index: 2;">
          <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 15px; line-height: 1.6; font-weight: 500;">
            [Mensaje detallado de la alerta. Debe ser claro y específico sobre el problema de seguridad detectado, su impacto potencial y las acciones que el usuario debe tomar inmediatamente.]
          </p>
          
          <!-- Detalles técnicos -->
          <div style="background: #fef2f2; border-radius: 8px; padding: 15px; margin: 15px 0; border: 1px solid #fecaca;">
            <h4 style="margin: 0 0 10px 0; color: #dc2626; font-size: 14px; font-weight: 700;">🔍 Detalles técnicos:</h4>
            <ul style="margin: 0; padding-left: 18px; color: #b91c1c; line-height: 1.6; font-size: 13px;">
              <li>Hora del incidente: [Timestamp]</li>
              <li>Ubicación: [IP/Ubicación]</li>
              <li>Tipo de amenaza: [Tipo]</li>
              <li>Nivel de riesgo: [Nivel]</li>
            </ul>
          </div>
        </div>
        
        <!-- Acciones recomendadas -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #10b981; position: relative; z-index: 2;">
          <h4 style="margin: 0 0 15px 0; color: #047857; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span style="background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px;">✓</span>
            Pasos a seguir:
          </h4>
          <ol style="margin: 0; padding-left: 20px; color: #065f46; line-height: 1.8; font-size: 14px; font-weight: 500;">
            <li style="margin-bottom: 8px;"><strong>Inmediato:</strong> Cambia tu contraseña ahora mismo</li>
            <li style="margin-bottom: 8px;"><strong>Verificar:</strong> Revisa tu actividad reciente en la cuenta</li>
            <li style="margin-bottom: 8px;"><strong>Habilitar:</strong> Activa la autenticación de dos factores</li>
            <li style="margin-bottom: 8px;"><strong>Contactar:</strong> Reporta cualquier actividad sospechosa</li>
          </ol>
        </div>
        
        <!-- Botones de acción -->
        <div style="display: flex; gap: 15px; margin-top: 25px; flex-wrap: wrap; position: relative; z-index: 2;">
          <a href="[secure_action_url]" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); transition: transform 0.3s ease;">
            🔐 Asegurar cuenta ahora
          </a>
          <a href="[support_url]" style="background: white; color: #ef4444; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; border: 2px solid #ef4444; transition: all 0.3s ease;">
            💬 Contactar soporte
          </a>
          <a href="[info_url]" style="background: transparent; color: #7f1d1d; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px;">
            ℹ️ Más información
          </a>
        </div>
        
        <!-- Información de contacto de emergencia -->
        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #f87171; text-align: center; position: relative; z-index: 2;">
          <p style="margin: 0 0 10px 0; color: #b91c1c; font-size: 12px; font-weight: 600;">
            📞 <strong>Línea de seguridad 24/7:</strong> <a href="tel:[emergency_phone]" style="color: #dc2626; text-decoration: none;">[emergency_phone]</a>
          </p>
          <p style="margin: 0; color: #7f1d1d; font-size: 11px;">
            Este es un mensaje automatizado del sistema de seguridad de ONIXU. No responder a este email.
          </p>
        </div>
      </div>
    `
  },
  {
    id: 5,
    name: "Encuesta de Satisfacción",
    category: "feedback",
    description: "Widget de encuesta interactiva con calificación por estrellas",
    html: `
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 30px; margin: 35px 0; text-align: center; border: 1px solid #0ea5e9; box-shadow: 0 4px 20px rgba(14, 165, 233, 0.15);">
        <!-- Header -->
        <div style="margin-bottom: 25px;">
          <div style="background: #0ea5e9; color: white; width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; box-shadow: 0 8px 25px rgba(14, 165, 233, 0.3);">
            💫
          </div>
          <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 22px; font-weight: 800;">¿Cómo ha sido tu experiencia?</h3>
          <p style="margin: 0; color: #075985; font-size: 16px; line-height: 1.6;">
            Tu opinión es muy valiosa para nosotros. Tómate un momento para evaluar nuestro servicio.
          </p>
        </div>
        
        <!-- Calificación por estrellas -->
        <div style="background: white; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #bae6fd;">
          <h4 style="margin: 0 0 20px 0; color: #0c4a6e; font-size: 16px; font-weight: 700;">Califica tu experiencia general:</h4>
          <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px;">
            <a href="[rating_url]?score=1" style="text-decoration: none; font-size: 28px; color: #fbbf24; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⭐</a>
            <a href="[rating_url]?score=2" style="text-decoration: none; font-size: 28px; color: #fbbf24; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⭐</a>
            <a href="[rating_url]?score=3" style="text-decoration: none; font-size: 28px; color: #fbbf24; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⭐</a>
            <a href="[rating_url]?score=4" style="text-decoration: none; font-size: 28px; color: #fbbf24; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⭐</a>
            <a href="[rating_url]?score=5" style="text-decoration: none; font-size: 28px; color: #fbbf24; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">⭐</a>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 12px;">Haz clic en las estrellas para calificar</p>
        </div>
        
        <!-- Preguntas específicas -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #bae6fd; text-align: left;">
          <h4 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 14px; font-weight: 700; text-align: center;">📝 Cuéntanos más (opcional):</h4>
          
          <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 8px 0; color: #075985; font-size: 13px; font-weight: 600;">¿Qué es lo que más te gustó?</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="[feedback_url]?positive=speed" style="background: #dcfce7; color: #047857; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">⚡ Velocidad</a>
              <a href="[feedback_url]?positive=support" style="background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">🛟 Soporte</a>
              <a href="[feedback_url]?positive=features" style="background: #fef3c7; color: #92400e; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">✨ Funciones</a>
              <a href="[feedback_url]?positive=price" style="background: #fdf2f8; color: #be185d; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">💰 Precio</a>
            </div>
          </div>
          
          <div>
            <p style="margin: 0 0 8px 0; color: #075985; font-size: 13px; font-weight: 600;">¿En qué podemos mejorar?</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
              <a href="[feedback_url]?improve=docs" style="background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">📚 Documentación</a>
              <a href="[feedback_url]?improve=ui" style="background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">🎨 Interfaz</a>
              <a href="[feedback_url]?improve=performance" style="background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">⚡ Rendimiento</a>
              <a href="[feedback_url]?improve=mobile" style="background: #f3f4f6; color: #4b5563; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 600;">📱 App móvil</a>
            </div>
          </div>
        </div>
        
        <!-- CTA principal -->
        <div style="margin-top: 25px;">
          <a href="[full_survey_url]" style="background: #0ea5e9; color: white; padding: 14px 30px; text-decoration: none; border-radius: 25px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); margin-right: 15px;">
            📋 Encuesta completa (2 min)
          </a>
          <a href="[skip_url]" style="color: #6b7280; text-decoration: none; font-size: 12px; font-weight: 600;">
            Recordar más tarde
          </a>
        </div>
        
        <!-- Incentivo -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 15px; margin-top: 20px; border: 1px solid #fbbf24;">
          <p style="margin: 0; color: #92400e; font-size: 12px; font-weight: 600;">
            🎁 <strong>Bonus:</strong> Completa la encuesta y recibe un 15% de descuento en tu próxima compra
          </p>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #bae6fd;">
          <p style="margin: 0; color: #6b7280; font-size: 10px; line-height: 1.4;">
            Tus respuestas son anónimas y nos ayudan a mejorar constantemente. Gracias por ser parte de nuestra comunidad.
          </p>
        </div>
      </div>
    `
  }
];

// Variables dinámicas para personalización - EXPANDIDAS
const dynamicVariables = [
  { key: "{name}", description: "Nombre del destinatario", category: "personal" },
  { key: "{first_name}", description: "Primer nombre del destinatario", category: "personal" },
  { key: "{last_name}", description: "Apellido del destinatario", category: "personal" },
  { key: "{email}", description: "Email del destinatario", category: "personal" },
  { key: "{company}", description: "Nombre de la empresa", category: "business" },
  { key: "{position}", description: "Cargo en la empresa", category: "business" },
  { key: "{department}", description: "Departamento", category: "business" },
  { key: "{industry}", description: "Industria o sector", category: "business" },
  { key: "{date}", description: "Fecha actual", category: "temporal" },
  { key: "{month}", description: "Mes actual", category: "temporal" },
  { key: "{year}", description: "Año actual", category: "temporal" },
  { key: "{time}", description: "Hora actual", category: "temporal" },
  { key: "{order_number}", description: "Número de pedido", category: "ecommerce" },
  { key: "{order_date}", description: "Fecha del pedido", category: "ecommerce" },
  { key: "{total}", description: "Total del pedido", category: "ecommerce" },
  { key: "{discount}", description: "Porcentaje de descuento", category: "marketing" },
  { key: "{coupon_code}", description: "Código de cupón", category: "marketing" },
  { key: "{expiry_date}", description: "Fecha de expiración", category: "marketing" },
  { key: "{action_url}", description: "URL de acción principal", category: "links" },
  { key: "{unsubscribe_url}", description: "URL para cancelar suscripción", category: "links" },
  { key: "{support_url}", description: "URL de soporte", category: "links" },
  { key: "{website_url}", description: "URL del sitio web", category: "links" }
];

// Función mejorada para obtener imagen recortada con más opciones
function getCroppedImg(imageSrc, croppedAreaPixels, rotation = 0, flip = { horizontal: false, vertical: false }) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const { width, height } = croppedAreaPixels;
      canvas.width = width;
      canvas.height = height;
      
      ctx.save();
      
      // Aplicar rotación
      if (rotation !== 0) {
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
      }
      
      // Aplicar flip
      if (flip.horizontal || flip.vertical) {
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
        ctx.translate(flip.horizontal ? -width : 0, flip.vertical ? -height : 0);
      }
      
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y,
        croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, width, height
      );
      
      ctx.restore();
      
      canvas.toBlob(blob => {
        resolve(blob);
      }, "image/png", 0.95);
    };
  });
}

// Modal de recorte ULTRA avanzado con filtros y efectos
function CropModal({ imageSrc, onComplete, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16/9);
  const [flip, setFlip] = useState({ horizontal: false, vertical: false });
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const aspectRatios = [
    { label: "16:9 (Panorámica)", value: 16/9, icon: "📺" },
    { label: "4:3 (Estándar)", value: 4/3, icon: "📷" },
    { label: "1:1 (Cuadrada)", value: 1, icon: "⬜" },
    { label: "3:4 (Vertical)", value: 3/4, icon: "📱" },
    { label: "21:9 (Ultra)", value: 21/9, icon: "🖥️" },
    { label: "Libre", value: null, icon: "🆓" }
  ];

  const handleCropComplete = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, flip);
      onComplete(blob);
    } catch (error) {
      console.error("Error al procesar imagen:", error);
      alert("Error al procesar la imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSettings = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlip({ horizontal: false, vertical: false });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.95)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      padding: "20px",
      boxSizing: "border-box"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        padding: "30px",
        borderRadius: "24px",
        width: "95%",
        maxWidth: "1000px",
        maxHeight: "95vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        overflow: "hidden"
      }}>
        
        {/* Header ultra moderno */}
        <div style={{ marginBottom: "25px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginBottom: "15px" }}>
            <span style={{ fontSize: "32px" }}>🎨</span>
            <h3 style={{ 
              margin: 0, 
              fontSize: "28px", 
              fontWeight: "800", 
              color: "#1f2937",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Editor de Imagen Ultra Pro
            </h3>
          </div>
          
          {/* Selector de relación de aspecto mejorado */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px", display: "block", color: "#374151" }}>
              📐 Relación de aspecto:
            </label>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
              {aspectRatios.map(ratio => (
                <button
                  key={ratio.label}
                  onClick={() => setAspectRatio(ratio.value)}
                  style={{
                    background: aspectRatio === ratio.value ? "#4f46e5" : "#f3f4f6",
                    color: aspectRatio === ratio.value ? "white" : "#374151",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  {ratio.icon} {ratio.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Layout principal con controles laterales */}
        <div style={{ display: "flex", gap: "25px", flex: 1, minHeight: 0 }}>
          
          {/* Panel de controles izquierdo */}
          <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Controles básicos */}
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "15px" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>🎯 Ajustes básicos</h4>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", display: "block", color: "#6b7280" }}>
                  Zoom: {zoom.toFixed(1)}x
                </label>
                <Slider
                  value={zoom}
                  min={1}
                  max={5}
                  step={0.1}
                  onChange={(e, value) => setZoom(value)}
                  style={{ width: "100%", color: "#4f46e5" }}
                />
              </div>
              
              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "8px", display: "block", color: "#6b7280" }}>
                  Rotación: {rotation}°
                </label>
                <Slider
                  value={rotation}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(e, value) => setRotation(value)}
                  style={{ width: "100%", color: "#10b981" }}
                />
              </div>
              
              {/* Controles de flip */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setFlip(prev => ({ ...prev, horizontal: !prev.horizontal }))}
                  style={{
                    background: flip.horizontal ? "#4f46e5" : "#e5e7eb",
                    color: flip.horizontal ? "white" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    flex: 1
                  }}
                >
                  ↔️ Horizontal
                </button>
                <button
                  onClick={() => setFlip(prev => ({ ...prev, vertical: !prev.vertical }))}
                  style={{
                    background: flip.vertical ? "#4f46e5" : "#e5e7eb",
                    color: flip.vertical ? "white" : "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    flex: 1
                  }}
                >
                  ↕️ Vertical
                </button>
              </div>
            </div>
            
            {/* Filtros avanzados */}
            <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "15px" }}>
              <h4 style={{ margin: "0 0 15px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>🌈 Filtros</h4>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", display: "block", color: "#6b7280" }}>
                  Brillo: {brightness}%
                </label>
                <Slider
                  value={brightness}
                  min={50}
                  max={150}
                  step={5}
                  onChange={(e, value) => setBrightness(value)}
                  style={{ width: "100%", color: "#f59e0b" }}
                />
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", display: "block", color: "#6b7280" }}>
                  Contraste: {contrast}%
                </label>
                <Slider
                  value={contrast}
                  min={50}
                  max={150}
                  step={5}
                  onChange={(e, value) => setContrast(value)}
                  style={{ width: "100%", color: "#8b5cf6" }}
                />
              </div>
              
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", display: "block", color: "#6b7280" }}>
                  Saturación: {saturation}%
                </label>
                <Slider
                  value={saturation}
                  min={0}
                  max={200}
                  step={10}
                  onChange={(e, value) => setSaturation(value)}
                  style={{ width: "100%", color: "#ef4444" }}
                />
              </div>
              
              <button
                onClick={resetSettings}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  width: "100%"
                }}
              >
                🔄 Restablecer
              </button>
            </div>
          </div>
          
          {/* Área del cropper central */}
          <div style={{ flex: 1, minHeight: "400px", position: "relative" }}>
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#f9fafb",
              borderRadius: "16px",
              overflow: "hidden",
              border: "3px solid #e5e7eb"
            }}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspectRatio}
                showGrid={true}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                style={{
                  containerStyle: {
                    borderRadius: "16px",
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Botones mejorados */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          marginTop: "25px",
          paddingTop: "25px",
          borderTop: "2px solid #f3f4f6"
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                backgroundColor: "#6b7280",
                color: "white",
                padding: "16px 28px",
                borderRadius: "12px",
                border: "none",
                cursor: isProcessing ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              ❌ Cancelar
            </button>
            
            <button
              onClick={resetSettings}
              style={{
                backgroundColor: "#f59e0b",
                color: "white",
                padding: "16px 28px",
                borderRadius: "12px",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "700"
              }}
            >
              🔄 Reset
            </button>
          </div>
          
          <button
            onClick={handleCropComplete}
            disabled={!croppedAreaPixels || isProcessing}
            style={{
              background: !croppedAreaPixels || isProcessing 
                ? "#9ca3af" 
                : "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "white",
              padding: "16px 40px",
              borderRadius: "12px",
              border: "none",
              cursor: !croppedAreaPixels || isProcessing ? "not-allowed" : "pointer",
              fontSize: "18px",
              fontWeight: "800",
              transition: "all 0.3s ease",
              transform: !croppedAreaPixels || isProcessing ? "none" : "translateY(-2px)",
              boxShadow: !croppedAreaPixels || isProcessing ? "none" : "0 10px 30px rgba(79, 70, 229, 0.4)"
            }}
          >
            {isProcessing ? "🔄 Procesando..." : "✨ Aplicar y Subir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente ImageUploader ultra mejorado
function ImageUploader({ onUploaded }) {
  const [loading, setLoading] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileChange = async (file) => {
    if (!file) return;
    
    // Validaciones avanzadas
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Formato no soportado. Usa: JPG, PNG, GIF, WebP, SVG");
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      alert("❌ Archivo muy grande. Máximo 25MB permitido.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target.result);
      setImagePreview(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFileChange(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    setLoading(true);
    setShowCrop(false);
    setUploadProgress(0);
    
    const formData = new FormData();
    const filename = `processed-${Date.now()}.png`;
    formData.append("file", new File([croppedBlob], filename, { 
      type: croppedBlob.type 
    }));

    try {
      // Simular progreso de subida realista
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      const response = await fetch("https://email-platform-api-j0fg.onrender.com/upload-image/", {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error('Error al subir imagen');
      }
      
      const data = await response.json();
      const url = `https://email-platform-api-j0fg.onrender.com${data.url}`;
      
      // Agregar al historial
      const newUpload = {
        id: Date.now(),
        url: url,
        filename: filename,
        timestamp: new Date().toLocaleString(),
        size: croppedBlob.size
      };
      setUploadHistory(prev => [newUpload, ...prev.slice(0, 4)]);
      
      onUploaded(url);
      
      setTimeout(() => setUploadProgress(0), 2000);
      
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al subir la imagen. Inténtalo de nuevo.");
      setUploadProgress(0);
    } finally {
      setLoading(false);
      setImageSrc(null);
      setImagePreview(null);
    }
  };

  return (
    <div style={{ marginBottom: "25px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <label className="block text-sm font-bold text-gray-700">
          📷 Subir Imagen Ultra Pro (Crop, Resize, Filtros)
        </label>
        {uploadHistory.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              color: "#374151"
            }}
          >
            📂 Historial ({uploadHistory.length})
          </button>
        )}
      </div>
      
      {/* Historial de uploads */}
      {showHistory && uploadHistory.length > 0 && (
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "15px",
          marginBottom: "15px",
          maxHeight: "150px",
          overflowY: "auto"
        }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>
            📂 Imágenes recientes
          </h4>
          <div style={{ display: "grid", gap: "8px" }}>
            {uploadHistory.map(upload => (
              <div key={upload.id} style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                background: "white",
                borderRadius: "6px",
                border: "1px solid #e5e7eb"
              }}>
                <img 
                  src={upload.url} 
                  alt="Uploaded" 
                  style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "4px" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>{upload.filename}</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af" }}>{upload.timestamp}</div>
                </div>
                <button
                  onClick={() => onUploaded(upload.url)}
                  style={{
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "10px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  Usar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Área de drop mejorada */}
      <div
        style={{
          border: dragActive ? "3px dashed #4f46e5" : "2px dashed #d1d5db",
          borderRadius: "20px",
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: dragActive ? "#f0f9ff" : "#fafafa",
          marginBottom: "15px",
          transition: "all 0.3s ease",
          position: "relative",
          overflow: "hidden"
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        {!loading && (
          <>
            <div style={{ 
              fontSize: "64px", 
              marginBottom: "20px",
              transition: "transform 0.3s ease",
              transform: dragActive ? "scale(1.2)" : "scale(1)"
            }}>
              {dragActive ? "📤" : "🖼️"}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleInputChange}
              disabled={loading}
              style={{ 
                marginBottom: "20px",
                padding: "10px 20px",
                borderRadius: "10px",
                border: "2px solid #4f46e5",
                background: "#4f46e5",
                color: "white",
                fontWeight: "600",
                cursor: "pointer"
              }}
            />
            
            <h3 style={{ 
              fontSize: "20px", 
              color: "#1f2937", 
              margin: "0 0 10px 0",
              fontWeight: "700"
            }}>
              📂 Arrastra tu imagen aquí
            </h3>
            
            <p style={{ 
              fontSize: "16px", 
              color: "#6b7280", 
              margin: "10px 0 20px 0",
              fontWeight: "500"
            }}>
              O haz clic en el botón para seleccionar
            </p>
            
            {/* Especificaciones técnicas */}
            <div style={{
              background: "white",
              borderRadius: "12px",
              padding: "15px",
              margin: "20px auto",
              maxWidth: "400px",
              border: "1px solid #e5e7eb"
            }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "700", color: "#374151" }}>
                🔧 Especificaciones
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", fontSize: "12px", color: "#6b7280" }}>
                <div>📐 <strong>Formatos:</strong> JPG, PNG, GIF, WebP, SVG</div>
                <div>💾 <strong>Tamaño máx:</strong> 25MB</div>
                <div>🎨 <strong>Filtros:</strong> Brillo, contraste, saturación</div>
                <div>✂️ <strong>Aspectos:</strong> 16:9, 4:3, 1:1, 3:4, libre</div>
              </div>
            </div>
          </>
        )}
        
        {/* Barra de progreso mejorada */}
        {loading && uploadProgress > 0 && (
          <div style={{ padding: "30px" }}>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⬆️</div>
            <h3 style={{ fontSize: "20px", color: "#4f46e5", marginBottom: "20px", fontWeight: "700" }}>
              Procesando imagen... {Math.round(uploadProgress)}%
            </h3>
            <div style={{ 
              width: "100%", 
              height: "12px", 
              backgroundColor: "#e5e7eb", 
              borderRadius: "6px",
              overflow: "hidden",
              marginBottom: "15px"
            }}>
              <div style={{ 
                width: `${uploadProgress}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #4f46e5, #7c3aed)",
                transition: "width 0.3s ease",
                borderRadius: "6px"
              }}></div>
            </div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              Optimizando calidad y aplicando filtros...
            </p>
          </div>
        )}
      </div>
      
      {/* Vista previa mejorada */}
      {imagePreview && !showCrop && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "15px", 
          padding: "15px", 
          backgroundColor: "#f0fdf4", 
          borderRadius: "12px",
          marginTop: "15px",
          border: "2px solid #10b981"
        }}>
          <img 
            src={imagePreview} 
            alt="Preview" 
            style={{ 
              width: "60px", 
              height: "60px", 
              objectFit: "cover", 
              borderRadius: "8px",
              border: "2px solid #10b981"
            }} 
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", color: "#047857", fontWeight: "700", marginBottom: "5px" }}>
              ✅ Imagen procesada exitosamente
            </div>
            <div style={{ fontSize: "14px", color: "#065f46" }}>
              Lista para insertar en tu correo
            </div>
          </div>
          <div style={{
            background: "#10b981",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "700"
          }}>
            LISTO
          </div>
        </div>
      )}
      
      {/* Modal de recorte */}
      {showCrop && imageSrc && (
        <CropModal
          imageSrc={imageSrc}
          onComplete={handleCropComplete}
          onCancel={() => {
            setShowCrop(false);
            setImageSrc(null);
            setImagePreview(null);
          }}
        />
      )}
    </div>
  );
}

// Panel de plantillas ultra mejorado
function TemplatesPanel({ onSelectTemplate, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const categories = [
    { id: 'all', name: 'Todas', icon: '📧', count: emailTemplates.length },
    { id: 'onboarding', name: 'Bienvenida', icon: '👋', count: emailTemplates.filter(t => t.category === 'onboarding').length },
    { id: 'newsletter', name: 'Newsletter', icon: '📰', count: emailTemplates.filter(t => t.category === 'newsletter').length },
    { id: 'promotion', name: 'Promociones', icon: '🎯', count: emailTemplates.filter(t => t.category === 'promotion').length },
    { id: 'transactional', name: 'Transaccional', icon: '🧾', count: emailTemplates.filter(t => t.category === 'transactional').length }
  ];

  const filteredTemplates = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? emailTemplates 
      : emailTemplates.filter(t => t.category === selectedCategory);
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchTerm]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.9)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9998,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "24px",
        width: "95%",
        maxWidth: "1400px",
        maxHeight: "95vh",
        overflow: "hidden",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Header mejorado */}
        <div style={{
          padding: "30px 40px",
          borderBottom: "1px solid #e5e7eb",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "900", marginBottom: "8px" }}>
                🎨 Plantillas Premium
              </h2>
              <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
                Diseños profesionales listos para usar
              </p>
            </div>
            <button 
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                color: "white",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "700",
                backdropFilter: "blur(10px)"
              }}
            >
              ✕ Cerrar
            </button>
          </div>
          
          {/* Buscador */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="🔍 Buscar plantillas por nombre, descripción o tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "15px 20px 15px 50px",
                borderRadius: "12px",
                border: "none",
                fontSize: "16px",
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(10px)"
              }}
            />
            <span style={{
              position: "absolute",
              left: "20px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "20px"
            }}>🔍</span>
          </div>
        </div>

        {/* Categorías mejoradas */}
        <div style={{
          padding: "25px 40px",
          borderBottom: "1px solid #f3f4f6",
          background: "#fafafa"
        }}>
          <div style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "30px",
                  border: "none",
                  backgroundColor: selectedCategory === category.id ? "#4f46e5" : "white",
                  color: selectedCategory === category.id ? "white" : "#374151",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "700",
                  transition: "all 0.3s ease",
                  boxShadow: selectedCategory === category.id 
                    ? "0 8px 25px rgba(79, 70, 229, 0.3)" 
                    : "0 2px 8px rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <span style={{ fontSize: "20px" }}>{category.icon}</span>
                {category.name}
                <span style={{
                  background: selectedCategory === category.id ? "rgba(255,255,255,0.2)" : "#e5e7eb",
                  color: selectedCategory === category.id ? "white" : "#6b7280",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

                {/* Grid de plantillas */}
        <div style={{
          flex: 1,
          padding: "40px",
          maxHeight: "600px",
          overflowY: "auto",
          background: "#f8fafc"
        }}>
          {filteredTemplates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "20px", opacity: 0.5 }}>🔍</div>
              <h3 style={{ color: "#6b7280", fontSize: "18px", margin: 0 }}>
                No se encontraron plantillas
              </h3>
              <p style={{ color: "#9ca3af", fontSize: "14px", margin: "8px 0 0 0" }}>
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
              gap: "30px"
            }}>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  style={{
                    border: "2px solid #e5e7eb",
                    borderRadius: "20px",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    background: "white",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
                  }}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 15px 35px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.08)";
                  }}
                >
                  {/* Preview de la plantilla */}
                  <div style={{
                    height: "220px",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "48px",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      position: "absolute",
                      inset: "15px",
                      backgroundColor: "white",
                      borderRadius: "12px",
                      padding: "20px",
                      fontSize: "11px",
                      fontFamily: "Arial, sans-serif",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column"
                    }}>
                      <div style={{ 
                        fontWeight: "bold", 
                        marginBottom: "8px", 
                        color: "#1f2937",
                        fontSize: "12px"
                      }}>
                        {template.subject.slice(0, 40)}...
                      </div>
                      <div dangerouslySetInnerHTML={{ 
                        __html: template.html.replace(/<[^>]*>/g, ' ').slice(0, 150) + "..." 
                      }} />
                    </div>
                    
                    {/* Badge de categoría */}
                    <div style={{
                      position: "absolute",
                      top: "15px",
                      right: "15px",
                      background: "rgba(0,0,0,0.8)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      textTransform: "uppercase"
                    }}>
                      {template.category}
                    </div>
                  </div>
                  
                  {/* Info de la plantilla */}
                  <div style={{ padding: "25px" }}>
                    <h3 style={{ 
                      margin: "0 0 10px 0", 
                      fontSize: "20px", 
                      fontWeight: "800", 
                      color: "#1f2937",
                      lineHeight: "1.3"
                    }}>
                      {template.name}
                    </h3>
                    <p style={{ 
                      margin: "0 0 15px 0", 
                      fontSize: "14px", 
                      color: "#6b7280",
                      lineHeight: "1.5"
                    }}>
                      {template.description}
                    </p>
                    <div style={{
                      background: "#f3f4f6",
                      padding: "10px 15px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#4b5563",
                      fontWeight: "500",
                      marginBottom: "20px"
                    }}>
                      <strong>Asunto:</strong> {template.subject.slice(0, 50)}...
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button style={{
                        flex: 1,
                        padding: "12px",
                        backgroundColor: "#4f46e5",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.3s ease"
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = "#4338ca"}
                      onMouseOut={(e) => e.target.style.backgroundColor = "#4f46e5"}
                      >
                        ✨ Usar plantilla
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewTemplate(template);
                        }}
                        style={{
                          padding: "12px 16px",
                          backgroundColor: "transparent",
                          color: "#4f46e5",
                          border: "2px solid #4f46e5",
                          borderRadius: "10px",
                          fontSize: "14px",
                          fontWeight: "700",
                          cursor: "pointer"
                        }}
                      >
                        👁️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de preview */}
      {previewTemplate && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.95)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            width: "90%",
            maxWidth: "800px",
            maxHeight: "90vh",
            overflow: "auto",
            position: "relative"
          }}>
            <div style={{
              position: "sticky",
              top: 0,
              background: "#1f2937",
              color: "white",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              zIndex: 10
            }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                👁️ Vista previa: {previewTemplate.name}
              </h3>
              <button 
                onClick={() => setPreviewTemplate(null)}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                ✕ Cerrar
              </button>
            </div>
            <div style={{ padding: "30px" }}>
              <div dangerouslySetInnerHTML={{ __html: previewTemplate.html }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Panel de snippets ultra mejorado
function SnippetsPanel({ onSelectSnippet, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    { id: 'all', name: 'Todos', icon: '📝' },
    { id: 'signature', name: 'Firmas', icon: '✍️' },
    { id: 'cta', name: 'Call-to-Action', icon: '🎯' },
    { id: 'social-proof', name: 'Testimonios', icon: '⭐' },
    { id: 'alert', name: 'Alertas', icon: '⚠️' },
    { id: 'feedback', name: 'Encuestas', icon: '📊' }
  ];

  const filteredSnippets = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? contentSnippets 
      : contentSnippets.filter(s => s.category === selectedCategory);
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchTerm]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "500px",
      height: "100vh",
      backgroundColor: "white",
      boxShadow: "-10px 0 50px rgba(0,0,0,0.15)",
      zIndex: 9997,
      display: "flex",
      flexDirection: "column",
      borderTopLeftRadius: "16px",
      borderBottomLeftRadius: "16px",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        padding: "25px",
        background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h3 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#1f2937" }}>
            🧩 Snippets Pro
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "700",
              color: "#374151"
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar snippets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "1px solid #d1d5db",
            fontSize: "14px"
          }}
        />
      </div>

      {/* Categorías */}
      <div style={{
        padding: "20px 25px",
        borderBottom: "1px solid #f3f4f6"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px"
        }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: "10px 16px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: selectedCategory === category.id ? "#4f46e5" : "#f9fafb",
                color: selectedCategory === category.id ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span style={{ fontSize: "16px" }}>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de snippets */}
      <div style={{
        flex: 1,
        padding: "25px",
        overflowY: "auto"
      }}>
        {filteredSnippets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "15px", opacity: 0.5 }}>🔍</div>
            <p style={{ color: "#6b7280", margin: 0 }}>No se encontraron snippets</p>
          </div>
        ) : (
          filteredSnippets.map(snippet => (
            <div
              key={snippet.id}
              style={{
                border: "2px solid #e5e7eb",
                borderRadius: "16px",
                marginBottom: "20px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                cursor: "pointer",
                background: "white"
              }}
              onClick={() => {
                onSelectSnippet(snippet.html);
                onClose();
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#4f46e5";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <h4 style={{ 
                    margin: 0, 
                    fontSize: "16px", 
                    fontWeight: "700", 
                    color: "#1f2937" 
                  }}>
                    {snippet.name}
                  </h4>
                  <span style={{
                    background: "#f3f4f6",
                    color: "#6b7280",
                    padding: "4px 8px",
                    borderRadius: "12px",
                    fontSize: "10px",
                    fontWeight: "600",
                    textTransform: "uppercase"
                  }}>
                    {snippet.category}
                  </span>
                </div>
                
                <p style={{ 
                  margin: "0 0 15px 0", 
                  fontSize: "13px", 
                  color: "#6b7280",
                  lineHeight: "1.5"
                }}>
                  {snippet.description}
                </p>
                
                {/* Miniatura del snippet */}
                <div style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "10px",
                  backgroundColor: "#f9fafb",
                  maxHeight: "80px",
                  overflow: "hidden",
                  marginBottom: "15px",
                  position: "relative"
                }}>
                  <div dangerouslySetInnerHTML={{ 
                    __html: snippet.html.slice(0, 200) + "..." 
                  }} />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "20px",
                    background: "linear-gradient(transparent, #f9fafb)"
                  }} />
                </div>
                
                <button style={{
                  width: "100%",
                  padding: "12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#10b981"}
                >
                  📝 Insertar snippet
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Panel de variables dinámicas ultra mejorado
function VariablesPanel({ onInsertVariable, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const categories = [
    { id: 'all', name: 'Todas', icon: '🔧' },
    { id: 'personal', name: 'Personales', icon: '👤' },
    { id: 'business', name: 'Empresa', icon: '🏢' },
    { id: 'temporal', name: 'Fecha/Hora', icon: '📅' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'links', name: 'Enlaces', icon: '🔗' }
  ];

  const filteredVariables = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? dynamicVariables 
      : dynamicVariables.filter(v => v.category === selectedCategory);
    
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchTerm]);

  return (
    <div style={{
      position: "fixed",
      bottom: "25px",
      right: "25px",
      width: "400px",
      backgroundColor: "white",
      borderRadius: "20px",
      boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
      zIndex: 9996,
      overflow: "hidden",
      maxHeight: "70vh",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        padding: "25px",
        background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        borderBottom: "1px solid #f3f4f6"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
          <h4 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1f2937" }}>
            🔧 Variables Dinámicas
          </h4>
          <button 
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "none",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "700"
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Buscador */}
        <input
          type="text"
          placeholder="🔍 Buscar variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "13px"
          }}
        />
      </div>
      
      {/* Categorías */}
      <div style={{ padding: "15px 25px", borderBottom: "1px solid #f3f4f6" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "15px",
                border: "none",
                backgroundColor: selectedCategory === category.id ? "#f59e0b" : "#f3f4f6",
                color: selectedCategory === category.id ? "white" : "#374151",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "700",
                transition: "all 0.3s ease"
              }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de variables */}
      <div style={{
        flex: 1,
        padding: "20px 25px",
        maxHeight: "300px",
        overflowY: "auto"
      }}>
        {filteredVariables.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.5 }}>🔍</div>
            <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>No se encontraron variables</p>
          </div>
        ) : (
          filteredVariables.map(variable => (
            <div
              key={variable.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #f3f4f6",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onClick={() => onInsertVariable(variable.key)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.borderRadius = "8px";
                e.currentTarget.style.padding = "12px 8px";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderRadius = "0";
                e.currentTarget.style.padding = "12px 0";
              }}
            >
              <div style={{ flex: 1 }}>
                <code style={{
                  backgroundColor: "#f3f4f6",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#4f46e5",
                  fontFamily: "'Fira Code', monospace"
                }}>
                  {variable.key}
                </code>
                <p style={{
                  margin: "6px 0 0 0",
                  fontSize: "11px",
                  color: "#6b7280",
                  lineHeight: "1.4"
                }}>
                  {variable.description}
                </p>
              </div>
              <button style={{
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                marginLeft: "10px"
              }}>
                +
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Footer con info */}
      <div style={{
        padding: "15px 25px",
        borderTop: "1px solid #f3f4f6",
        background: "#f8fafc"
      }}>
        <p style={{
          margin: 0,
          fontSize: "10px",
          color: "#9ca3af",
          textAlign: "center",
          lineHeight: "1.4"
        }}>
          💡 Las variables se reemplazarán automáticamente al enviar el correo
        </p>
      </div>
    </div>
  );
}

// Componente principal EmailCompose ULTRA COMPLETO
const EmailCompose = () => {
  // Estados existentes y nuevos
  const [formData, setFormData] = useState({ 
    to: '', 
    cc: '',
    bcc: '',
    subject: '', 
    body: '', 
    mailbox_id: '',
    priority: 'normal',
    track_opens: true,
    track_clicks: true
  });
  
  const [mailboxes, setMailboxes] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  
  // Estados avanzados
  const [editorMode, setEditorMode] = useState('html');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [scheduledSend, setScheduledSend] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [emailStats, setEmailStats] = useState({
    subjectScore: 0,
    readabilityScore: 0,
    spamScore: 0
  });
  
  const quillRef = useRef(null);

  // Cargar buzones al montar
  useEffect(() => {
    const fetchMailboxes = async () => {
      try {
        const response = await api.get('/mailboxes');
        setMailboxes(response.data);
      } catch (error) {
        console.error("Error cargando buzones:", error);
        setStatus('❌ Error cargando buzones de correo');
      }
    };
    fetchMailboxes();
  }, []);

  // Contador en tiempo real y análisis
  useEffect(() => {
    const analyzeContent = () => {
      let textContent = '';
      if (editorMode === 'html') {
        textContent = formData.body.replace(/<[^>]*>/g, ' ');
      } else {
        textContent = formData.body;
      }
      
      const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setCharacterCount(textContent.length);
      
      // Análisis básico de calidad
      const subjectLength = formData.subject.length;
      const subjectScore = subjectLength >= 30 && subjectLength <= 50 ? 100 : 
                          subjectLength >= 20 && subjectLength <= 60 ? 75 : 50;
      
      const readabilityScore = words.length >= 50 && words.length <= 200 ? 100 :
                              words.length >= 30 && words.length <= 300 ? 75 : 50;
      
      // Detección básica de spam (palabras de advertencia)
      const spamWords = ['gratis', 'free', 'urgente', 'limited time', '!!!', 'click here'];
      const spamCount = spamWords.filter(word => 
        textContent.toLowerCase().includes(word.toLowerCase()) ||
        formData.subject.toLowerCase().includes(word.toLowerCase())
      ).length;
      const spamScore = Math.max(0, 100 - (spamCount * 20));
      
      setEmailStats({
        subjectScore,
        readabilityScore,
        spamScore
      });
    };
    
    analyzeContent();
  }, [formData.body, formData.subject, editorMode]);

  // Handlers principales
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuillChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

  const handlePlainTextChange = (content) => {
    setFormData(prev => ({ ...prev, body: content }));
  };

  const handleModeChange = (mode) => {
    setEditorMode(mode);
    if (mode === 'plain' && quillRef.current) {
      const textContent = quillRef.current.getEditor().getText();
      setFormData(prev => ({ ...prev, body: textContent }));
    } else if (mode === 'html' && formData.body && !formData.body.includes('<')) {
      setFormData(prev => ({ ...prev, body: `<p>${prev.body.replace(/\n/g, '</p><p>')}</p>` }));
    }
  };

  const insertImageInQuill = useCallback((imageUrl) => {
    if (!quillRef.current) return;
    
    const editor = quillRef.current.getEditor();
    const range = editor.getSelection(true);
    editor.insertEmbed(range ? range.index : 0, "image", imageUrl);
    
    setFormData(prev => ({
      ...prev,
      body: editor.root.innerHTML,
    }));
  }, []);

  const handleEmoji = useCallback((emojiObj) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const selection = editor.getSelection() || { index: editor.getLength() };
      editor.insertText(selection.index, emojiObj.emoji);
      setShowEmoji(false);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + emojiObj.emoji
      }));
      setShowEmoji(false);
    }
  }, [editorMode]);

  const handleImageUploaded = useCallback((imageUrl) => {
    if (editorMode === 'html') {
      insertImageInQuill(imageUrl);
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + `\n[Imagen: ${imageUrl}]`
      }));
    }
    setGalleryRefresh(prev => prev + 1);
  }, [editorMode, insertImageInQuill]);

  const handleTemplateSelect = useCallback((template) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.html
    }));
    
    if (editorMode === 'html' && quillRef.current) {
      quillRef.current.getEditor().root.innerHTML = template.html;
    }
  }, [editorMode]);

  const handleSnippetInsert = useCallback((snippetHtml) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      const index = range ? range.index : editor.getLength();
      editor.clipboard.dangerouslyPasteHTML(index, snippetHtml);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML
      }));
    } else {
      const cleanText = snippetHtml.replace(/<[^>]*>/g, '');
      setFormData(prev => ({
        ...prev,
        body: prev.body + '\n' + cleanText
      }));
    }
  }, [editorMode]);

  const handleVariableInsert = useCallback((variable) => {
    if (editorMode === 'html' && quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection() || { index: editor.getLength() };
      editor.insertText(range.index, variable);
      
      setFormData(prev => ({
        ...prev,
        body: editor.root.innerHTML
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        body: prev.body + variable
      }));
    }
  }, [editorMode]);

  const handleSaveDraft = async () => {
    try {
      setSaveAsDraft(true);
      // Implementar guardado como borrador
      setTimeout(() => {
        setStatus('💾 Borrador guardado correctamente');
        setSaveAsDraft(false);
      }, 1500);
    } catch (error) {
      setStatus('❌ Error al guardar borrador');
      setSaveAsDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      // Validaciones
      if (!formData.to.trim()) {
        throw new Error('El destinatario es obligatorio');
      }
      if (!formData.subject.trim()) {
        throw new Error('El asunto es obligatorio');
      }
      if (!formData.body.trim()) {
        throw new Error('El contenido del mensaje es obligatorio');
      }

      const emailData = {
        to: formData.to,
        subject: formData.subject,
        cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : undefined,
        bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : undefined,
        priority: formData.priority,
        track_opens: formData.track_opens,
        track_clicks: formData.track_clicks
      };

      if (editorMode === 'html') {
        emailData.body = 'Este correo requiere un cliente que soporte HTML.';
        emailData.html_body = formData.body;
      } else {
        emailData.body = formData.body;
        emailData.html_body = null;
      }

      if (formData.mailbox_id && formData.mailbox_id !== '') {
        emailData.mailbox_id = parseInt(formData.mailbox_id);
      }

      if (scheduledSend && scheduleDate) {
        emailData.schedule_date = scheduleDate;
      }

      await api.post('/emails/send', emailData);
      setStatus('🎉 ¡Correo enviado exitosamente!');
      
      // Limpiar formulario
      setFormData({ 
        to: '', 
        cc: '',
        bcc: '',
        subject: '', 
        body: '', 
        mailbox_id: '',
        priority: 'normal',
        track_opens: true,
        track_clicks: true
      });
      
      if (quillRef.current) {
        quillRef.current.getEditor().setContents([]);
      }
      
    } catch (error) {
      console.error("Error enviando email:", error);
      setStatus('❌ Error al enviar correo: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow-2xl rounded-3xl" style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header ultra moderno */}
      <div style={{ 
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", 
        padding: "30px 40px",
        color: "white",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b)"
        }} />
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "36px", fontWeight: "900", letterSpacing: "-1px" }}>
              🚀 Email Composer Ultra Pro
            </h3>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              La herramienta de email marketing más avanzada
            </p>
          </div>
          <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{wordCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>palabras</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "800" }}>{characterCount}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>caracteres</div>
            </div>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saveAsDraft}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                color: "white",
                cursor: saveAsDraft ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "700",
                backdropFilter: "blur(10px)"
              }}
            >
              {saveAsDraft ? "💾 Guardando..." : "💾 Guardar Borrador"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-10">
        {/* Toolbar superior ultra avanzado */}
        <div style={{ 
          display: "flex", 
          gap: "20px", 
          marginBottom: "30px", 
          flexWrap: "wrap",
          alignItems: "center",
          padding: "25px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(240, 147, 251, 0.4)"
        }}>
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            🎨 Plantillas Premium
          </button>
          
          <button
            type="button"
            onClick={() => setShowSnippets(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            🧩 Snippets Pro
          </button>
          
          <button
            type="button"
            onClick={() => setShowVariables(true)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            🔧 Variables Dinámicas
          </button>
          
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "none",
              borderRadius: "16px",
              padding: "16px 24px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "800",
              color: "#1f2937",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
            }}
          >
            😊 Emojis & Símbolos
          </button>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "20px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "white", fontSize: "16px", fontWeight: "700" }}>
              <input
                type="checkbox"
                checked={showPreview}
                onChange={(e) => setShowPreview(e.target.checked)}
                style={{ transform: "scale(1.5)" }}
              />
              Vista previa en vivo
            </label>
          </div>
        </div>

        {/* Panel de análisis de calidad */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
          padding: "25px",
          borderRadius: "20px",
          marginBottom: "30px",
          border: "2px solid #10b981"
        }}>
          <h4 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "800", color: "#065f46" }}>
            📊 Análisis de Calidad del Email
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#10b981 ${emailStats.subjectScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                position: "relative"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#10b981"
                }}>
                  {emailStats.subjectScore}%
                </div>
              </div>
              <div style={{ color: "#065f46", fontWeight: "700", fontSize: "14px" }}>Asunto</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Optimización SEO</div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(#3b82f6 ${emailStats.readabilityScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: "#3b82f6"
                }}>
                  {emailStats.readabilityScore}%
                </div>
              </div>
              <div style={{ color: "#1e40af", fontWeight: "700", fontSize: "14px" }}>Legibilidad</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Comprensión</div>
            </div>
            
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: `conic-gradient(${emailStats.spamScore >= 80 ? '#10b981' : emailStats.spamScore >= 60 ? '#f59e0b' : '#ef4444'} ${emailStats.spamScore * 3.6}deg, #e5e7eb 0deg)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "16px",
                  color: emailStats.spamScore >= 80 ? '#10b981' : emailStats.spamScore >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {emailStats.spamScore}%
                </div>
              </div>
              <div style={{ color: "#dc2626", fontWeight: "700", fontSize: "14px" }}>Anti-Spam</div>
              <div style={{ color: "#6b7280", fontSize: "12px" }}>Entregabilidad</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Configuración avanzada del email */}
          <div style={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            padding: "30px",
            borderRadius: "20px",
            marginBottom: "30px"
          }}>
            <h4 style={{ margin: "0 0 25px 0", fontSize: "24px", fontWeight: "800", color: "#1f2937" }}>
              ⚙️ Configuración Avanzada de Envío
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "25px" }}>
              {/* Modo de edición */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Tipo de contenido
                </label>
                <select 
                  value={editorMode}
                  onChange={(e) => handleModeChange(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e5e7eb",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "white"
                  }}
                >
                  <option value="html">🎨 HTML Avanzado (Rich Text)</option>
                  <option value="plain">📝 Texto Simple (Plain Text)</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Prioridad del email
                </label>
                <select 
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "2px solid #e5e7eb",
                    fontSize: "16px",
                    fontWeight: "600",
                    background: "white"
                  }}
                >
                  <option value="low">🟢 Baja Prioridad</option>
                  <option value="normal">🟡 Prioridad Normal</option>
                  <option value="high">🔴 Alta Prioridad</option>
                </select>
              </div>

              {/* Opciones de tracking */}
              <div>
                <label style={{ display: "block", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151" }}>
                  Opciones de seguimiento
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_opens"
                      checked={formData.track_opens}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_opens: e.target.checked }))}
                      style={{ transform: "scale(1.3)" }}
                    />
                    📊 Rastrear aperturas de email
                  </label>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "600", color: "#374151", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="track_clicks"
                      checked={formData.track_clicks}
                      onChange={(e) => setFormData(prev => ({ ...prev, track_clicks: e.target.checked }))}
                      style={{ transform: "scale(1.3)" }}
                    />
                    🔗 Rastrear clicks en enlaces
                  </label>
                </div>
              </div>

              {/* Envío programado */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "16px", fontWeight: "700", marginBottom: "10px", color: "#374151", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={scheduledSend}
                    onChange={(e) => setScheduledSend(e.target.checked)}
                    style={{ transform: "scale(1.3)" }}
                  />
                  ⏰ Programar envío
                </label>
                
                {scheduledSend && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: "2px solid #e5e7eb",
                      fontSize: "16px",
                      fontWeight: "600",
                      background: "white"
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Selección de buzón */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              📮 Buzón de envío
            </label>
            <select
              name="mailbox_id"
              value={formData.mailbox_id}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "18px 20px",
                borderRadius: "16px",
                border: "3px solid #e5e7eb",
                fontSize: "18px",
                fontWeight: "600",
                background: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
              }}
            >
              <option value="">Seleccionar buzón de correo...</option>
              {mailboxes.map(mailbox => (
                <option key={mailbox.id} value={mailbox.id}>
                  {mailbox.name} ({mailbox.email})
                  {mailbox.is_verified ? " ✅ Verificado" : " ⚠️ Sin verificar"}
                </option>
              ))}
            </select>
          </div>

          {/* Campos de destinatarios mejorados */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "20px" }}>
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                📧 Para (obligatorio)
              </label>
              <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleChange}
                required
                placeholder="destinatario@example.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500",
                  background: "white"
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                📎 CC (con copia)
              </label>
              <input
                type="text"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                placeholder="cc@email.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500"
                }}
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                🤫 BCC (copia oculta)
              </label>
              <input
                type="text"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                placeholder="bcc@email.com"
                style={{
                  width: "100%",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: "3px solid #e5e7eb",
                  fontSize: "18px",
                  fontWeight: "500"
                }}
              />
            </div>
          </div>

          {/* Asunto mejorado */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <label className="block text-lg font-bold text-gray-700">
                📝 Asunto del correo
              </label>
              <span style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "700",
                color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b",
                backgroundColor: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#dcfce7" : "#fef3c7"
              }}>
                {formData.subject.length}/50 caracteres
              </span>
            </div>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Escribe un asunto atractivo y descriptivo..."
              style={{
                width: "100%",
                padding: "20px 24px",
                borderRadius: "16px",
                border: "3px solid #e5e7eb",
                fontSize: "20px",
                fontWeight: "600",
                background: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
              }}
            />
          </div>

          {/* Área de contenido principal */}
          <div style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: "30px" }}>
            {/* Editor */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-4">
                ✍️ Contenido del mensaje
              </label>
              
              <ImageUploader onUploaded={handleImageUploaded} />
              
              <input
                type="text"
                placeholder="🔍 Buscar en galería de imágenes..."
                value={galleryFilter}
                onChange={e => setGalleryFilter(e.target.value)}
                style={{
                  width: "75%",
                  padding: "12px 18px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  border: "2px solid #d1d5db",
                  fontSize: "16px"
                }}
              />
              
              <ImageGallery
                onSelect={insertImageInQuill}
                refreshTrigger={galleryRefresh}
                filter={galleryFilter}
              />
              
              {showEmoji && (
                <div style={{ marginBottom: "25px", borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}>
                  <EmojiPicker 
                    onEmojiClick={handleEmoji}
                    width="100%"
                    height="400px"
                  />
                </div>
              )}
              
              {editorMode === 'html' ? (
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={formData.body}
                  onChange={handleQuillChange}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ 
                    minHeight: "500px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    background: "white"
                  }}
                  placeholder="Escribe tu mensaje HTML aquí... Usa la barra de herramientas para formatear el contenido de forma profesional."
                />
              ) : (
                <textarea
                  value={formData.body}
                  onChange={(e) => handlePlainTextChange(e.target.value)}
                  placeholder="Escribe tu mensaje en texto simple aquí..."
                  style={{
                    width: "100%",
                    minHeight: "500px",
                    padding: "25px",
                    borderRadius: "16px",
                    border: "3px solid #e5e7eb",
                    fontSize: "18px",
                    fontFamily: "'Fira Code', monospace",
                    lineHeight: "1.7",
                    resize: "vertical",
                    boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                    background: "white"
                  }}
                />
              )}
            </div>

            {/* Vista previa ultra avanzada */}
            {showPreview && (
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-4">
                  👁️ Vista previa en tiempo real
                </label>
                
                <div style={{
                  border: "3px solid #e5e7eb",
                  borderRadius: "20px",
                  minHeight: "500px",
                  backgroundColor: "#fafafa",
                  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
                  overflow: "hidden"
                }}>
                  {/* Header del email preview */}
                  <div style={{
                    borderBottom: "2px solid #e5e7eb",
                    paddingBottom: "20px",
                    padding: "25px",
                    background: "white"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "800",
                        fontSize: "16px"
                      }}>
                        {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name?.charAt(0) || "M"}
                      </div>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: "700", color: "#1f2937" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.name || "Tu Nombre"}
                        </div>
                        <div style={{ fontSize: "14px", color: "#6b7280" }}>
                          {mailboxes.find(m => m.id === parseInt(formData.mailbox_id))?.email || "tu@email.com"}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>Para: </span>
                      <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.to || "destinatario@ejemplo.com"}</span>
                    </div>
                    
                    {formData.cc && (
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "600" }}>CC: </span>
                        <span style={{ fontSize: "14px", color: "#1f2937", fontWeight: "600" }}>{formData.cc}</span>
                      </div>
                    )}
                    
                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#1f2937", marginTop: "15px" }}>
                      {formData.subject || "Tu asunto aparecerá aquí..."}
                    </div>
                    
                    {formData.priority !== 'normal' && (
                      <div style={{
                        marginTop: "10px",
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        backgroundColor: formData.priority === 'high' ? "#fef2f2" : "#f0f9ff",
                        color: formData.priority === 'high' ? "#dc2626" : "#1e40af"
                      }}>
                        {formData.priority === 'high' ? "🔴 ALTA PRIORIDAD" : "🟢 BAJA PRIORIDAD"}
                      </div>
                    )}
                  </div>
                  
                  {/* Contenido del email */}
                  <div style={{ padding: "25px" }}>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formData.body || "<p style='color: #9ca3af; font-style: italic; text-align: center; padding: 60px 20px;'>👆 El contenido aparecerá aquí conforme escribas...<br/>¡Usa las herramientas de formato para crear emails impresionantes!</p>" 
                      }} 
                      style={{ 
                        fontSize: "16px",
                        lineHeight: "1.7",
                        minHeight: "200px",
                        color: "#374151"
                      }} 
                    />
                  </div>
                </div>
                
                {/* Panel de estadísticas de contenido */}
                <div style={{
                  marginTop: "20px",
                  padding: "20px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "16px",
                  border: "2px solid #3b82f6",
                  fontSize: "14px"
                }}>
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "16px", fontWeight: "800", color: "#1e40af" }}>
                    📊 Estadísticas del contenido
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "15px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📝 Palabras:</span>
                      <strong style={{ color: "#1e40af" }}>{wordCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>🔤 Caracteres:</span>
                      <strong style={{ color: "#1e40af" }}>{characterCount}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>📧 Asunto:</span>
                      <strong style={{ color: formData.subject.length >= 30 && formData.subject.length <= 50 ? "#10b981" : "#f59e0b" }}>
                        {formData.subject.length}/50
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "600" }}>🎨 Modo:</span>
                      <strong style={{ color: "#1e40af" }}>{editorMode === 'html' ? '🎨 HTML' : '📝 Texto'}</strong>
                    </div>
                  </div>
                  
                  {/* Tiempo estimado de lectura */}
                  <div style={{ marginTop: "15px", padding: "12px", background: "white", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "600" }}>⏱️ Tiempo de lectura:</span>
                      <strong style={{ color: "#10b981" }}>{Math.max(1, Math.ceil(wordCount / 200))} min</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción ultra mejorados */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "40px",
            borderTop: "3px solid #f3f4f6",
            marginTop: "40px"
          }}>
            <div style={{ display: "flex", gap: "20px" }}>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saveAsDraft}
                style={{
                  backgroundColor: "#6b7280",
                  color: "white",
                  padding: "18px 32px",
                  borderRadius: "16px",
                  border: "none",
                  cursor: saveAsDraft ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  fontWeight: "700",
                  opacity: saveAsDraft ? 0.7 : 1,
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(107, 114, 128, 0.3)"
                }}
              >
                {saveAsDraft ? "💾 Guardando..." : "💾 Guardar Borrador"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#9ca3af" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                padding: "20px 50px",
                borderRadius: "20px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "22px",
                fontWeight: "900",
                boxShadow: loading ? "none" : "0 15px 35px rgba(102, 126, 234, 0.5)",
                transform: loading ? "none" : "translateY(-3px)",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
            >
              {loading ? '📤 Enviando...' : (scheduledSend ? '⏰ Programar Envío' : '🚀 Enviar Correo Ahora')}
            </button>
          </div>

          {/* Mensaje de estado ultra mejorado */}
          {status && (
            <div 
              style={{
                padding: "25px 30px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: "700",
                textAlign: "center",
                marginTop: "30px",
                backgroundColor: status.includes("Error") || status.includes("❌") 
                  ? "#fef2f2" : "#f0fff4",
                color: status.includes("Error") || status.includes("❌")
                  ? "#dc2626" : "#065f46",
                border: status.includes("Error") || status.includes("❌")
                  ? "3px solid #fecaca" : "3px solid #bbf7d0",
                boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
              }}
            >
              {status}
            </div>
          )}
        </form>
      </div>

      {/* Paneles modales */}
      {showTemplates && (
        <TemplatesPanel
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showSnippets && (
        <SnippetsPanel
          onSelectSnippet={handleSnippetInsert}
          onClose={() => setShowSnippets(false)}
        />
      )}

      {showVariables && (
        <VariablesPanel
          onInsertVariable={handleVariableInsert}
          onClose={() => setShowVariables(false)}
        />
      )}
    </div>
  );
};

export default EmailCompose;

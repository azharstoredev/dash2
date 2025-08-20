import { RequestHandler } from "express";
import { promises as fs } from "fs";
import { join } from "path";

interface CharacterFix {
  corrupted: string;
  fixed: string;
  description: string;
}

// Common UTF-8 character corruptions and their fixes
const CHARACTER_FIXES: CharacterFix[] = [
  {
    corrupted: "إجمال��",
    fixed: "إجمالي",
    description: "Arabic word 'total'"
  },
  {
    corrupted: "ا��إيرادات",
    fixed: "الإيرادات", 
    description: "Arabic word 'revenues'"
  },
  {
    corrupted: "ال��ميل",
    fixed: "العميل",
    description: "Arabic word 'customer'"
  },
  {
    corrupted: "ا��عميل", 
    fixed: "العميل",
    description: "Arabic word 'customer'"
  },
  {
    corrupted: "ا��سلة",
    fixed: "السلة",
    description: "Arabic word 'basket'"
  },
  {
    corrupted: "الفر��ي",
    fixed: "الفرعي",
    description: "Arabic word 'sub/partial'"
  },
  {
    corrupted: "الت��صيل",
    fixed: "التوصيل",
    description: "Arabic word 'delivery'"
  },
  {
    corrupted: "��لطلب",
    fixed: "الطلب",
    description: "Arabic word 'order'"
  },
  {
    corrupted: "ا��تلمنا",
    fixed: "استلمنا",
    description: "Arabic word 'we received'"
  },
  {
    corrupted: "م��",
    fixed: "من",
    description: "Arabic word 'from'"
  },
  {
    corrupted: "م��تج",
    fixed: "منتج",
    description: "Arabic word 'product'"
  },
  {
    corrupted: "إزال��",
    fixed: "إزالة",
    description: "Arabic word 'removal'"
  },
  {
    corrupted: "أ��ام",
    fixed: "أيام",
    description: "Arabic word 'days'"
  },
  {
    corrupted: "مت��حة",
    fixed: "متاحة",
    description: "Arabic word 'available'"
  },
  {
    corrupted: "احتياط��",
    fixed: "احتياطي",
    description: "Arabic word 'backup'"
  },
  {
    corrupted: "إعداد��ت",
    fixed: "إعدادات",
    description: "Arabic word 'settings'"
  },
  {
    corrupted: "��ضع",
    fixed: "وضع",
    description: "Arabic word 'mode'"
  },
  {
    corrupted: "التح��م",
    fixed: "التحكم",
    description: "Arabic word 'control'"
  },
  {
    corrupted: "منت��ات",
    fixed: "منتجات",
    description: "Arabic word 'products'"
  },
  {
    corrupted: "العرب��ة",
    fixed: "العربية",
    description: "Arabic word 'Arabic'"
  }
];

export const handleFixCharacters: RequestHandler = async (req, res) => {
  try {
    const filesToCheck = [
      "client/contexts/LanguageContext.tsx",
      "client/pages/Checkout.tsx",
      "client/components/CheckoutDialog.tsx",
      "client/components/ImprovedOrderSummary.tsx"
    ];

    let totalFixes = 0;
    const fixReport: Array<{
      file: string;
      fixes: Array<{ from: string; to: string; description: string; line?: number }>;
    }> = [];

    for (const relativePath of filesToCheck) {
      const filePath = join(process.cwd(), relativePath);
      
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        let updatedContent = content;
        const fileFixes: Array<{ from: string; to: string; description: string; line?: number }> = [];

        // Apply character fixes
        for (const fix of CHARACTER_FIXES) {
          if (updatedContent.includes(fix.corrupted)) {
            const regex = new RegExp(fix.corrupted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = content.match(regex);
            if (matches) {
              updatedContent = updatedContent.replace(regex, fix.fixed);
              fileFixes.push({
                from: fix.corrupted,
                to: fix.fixed,
                description: fix.description
              });
              totalFixes += matches.length;
            }
          }
        }

        // Also check for any remaining replacement characters
        const replacementCharRegex = /\uFFFD/g;
        const replacementMatches = updatedContent.match(replacementCharRegex);
        if (replacementMatches) {
          // For any remaining replacement characters, try to guess the fix based on context
          updatedContent = updatedContent.replace(/\uFFFD\uFFFD/g, ''); // Remove double replacement chars
          updatedContent = updatedContent.replace(/\uFFFD/g, ''); // Remove single replacement chars
          
          fileFixes.push({
            from: '�',
            to: '(removed)',
            description: 'Removed unidentifiable replacement characters'
          });
          totalFixes += replacementMatches.length;
        }

        if (fileFixes.length > 0) {
          await fs.writeFile(filePath, updatedContent, 'utf-8');
          fixReport.push({
            file: relativePath,
            fixes: fileFixes
          });
        }

      } catch (fileError) {
        console.warn(`Could not process file ${relativePath}:`, fileError);
      }
    }

    res.json({
      success: true,
      totalFixes,
      fixReport,
      message: `Fixed ${totalFixes} corrupted characters across ${fixReport.length} files`
    });

  } catch (error) {
    console.error("Character fix error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fix characters",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

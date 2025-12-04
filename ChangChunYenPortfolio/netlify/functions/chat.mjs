export default async (req, context) => {
  // 修正 1: Export 改為小寫 export
  
  // 只允許 POST 請求
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const userMessage = body.message || "你好";

    // 修正 2: 在 Edge Function 中，必須使用 Netlify.env.get 來抓取變數
    // 如果這行報錯，我們改用備用方案
    const apiKey = Netlify.env.get("OPENROUTER_API_KEY");

    if (!apiKey) {
      console.error("Error: API Key is missing.");
      return new Response(JSON.stringify({ reply: "系統設定錯誤：找不到 API Key (請檢查 Netlify 環境變數設定)。" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = `
      你現在是「張俊彥 (Jayen Z.)」個人作品集的專屬 AI 導覽員。
      
      【關於張俊彥】
      - 身份：崑山科大資管系學生、遊戲開發者、技術美術 (Tech Artist)。
      - 經歷：擁有 5-6 年傳產物流經驗，目前積極轉職軟體工程師。
      - 核心技能：Unity (C#), Unreal Engine 5 (Blueprint/Niagara), Python, Generative AI。
      - 美術技能：Adobe After Effects (持有國際證照), ZBrush, Premiere。
      - 作品亮點：Shadow Archer (Unity RPG), Visual Portfolio (AE), Fire Dragon VFX, IMS 庫存管理系統 (WinForms)。
      
      【你的任務】
      - 請用「繁體中文」回答。
      - 語氣要專業、熱情且友善。
      - 若訪客詢問聯絡方式，請引導至 Email: a0965332528@gmail.com。
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://zhangjunyan-portfolio.netlify.app/",
        "X-Title": "Jayen Portfolio AI",
      },
      body: JSON.stringify({
        "model": "google/gemini-flash-1.5-8b:free", 
        "messages": [
          {"role": "system", "content": systemPrompt},
          {"role": "user", "content": userMessage}
        ],
        "temperature": 0.7,
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    
    // 增加保護：確保 choices 存在
    if (!data.choices || data.choices.length === 0) {
        throw new Error("AI 沒有回傳任何內容 (Choices is empty)");
    }

    const aiReply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply: aiReply }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Server Error:", error);
    
    // 修正 3: 將具體錯誤訊息回傳到前端，這樣你才看得到哪裡錯了
    return new Response(JSON.stringify({ 
        reply: `系統發生錯誤 (Debug): ${error.message || error.toString()}` 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};


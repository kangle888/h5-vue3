import{w as y,d as A,e as x,g as I,h as B,i as e,j as S,k as i,B as T,c as t,I as $,l as g,P as h,v as c,G as b,z as w,_ as U}from"./index-DIGDrDbW.js";import{a as V}from"./c-auth-Cke1iIny.js";import{a as P}from"./c-user-CdfJzLuc.js";import{s as z,a as N}from"./function-call-CaOqKW4G.js";import"./index-B4MN-8dB.js";y(z);const j={class:"settings-page-wrapper w-full"},D={class:"box-border"},L={class:"content-container"},E={class:"group group-panel"},G={class:"cell"},M={class:"value"},R={class:"group group-panel"},q={class:"group group-panel"},F={class:"agreement-sheet"},H={class:"agreement-header"},J={class:"agreement-sheet"},K={class:"agreement-header"},O={class:"agreement-title"},Q={class:"agreement-body"},W=`欢迎使用遇见App（以下简称“本平台”）。本协议是您与本平台之间就使用服务所订立的协议。

1. 服务说明
1.1 本平台提供交友互动、聊天沟通、内容浏览等服务。
1.2 您在使用过程中应遵守法律法规与平台规则，不得发布违法违规内容。

2. 账号与安全
2.1 您应保证注册信息真实、合法、有效。
2.2 请妥善保管账号与密码，因您自身原因造成的风险由您承担。

3. 用户行为规范
3.1 不得发布涉黄涉赌、暴力恐怖、诈骗引流等违法内容。
3.2 不得侮辱、诽谤、骚扰他人，不得侵犯他人合法权益。
3.3 不得利用平台从事任何违法活动。

4. 内容与知识产权
4.1 您发布的内容应具备合法来源，且不侵犯第三方权利。
4.2 本平台享有依法维护平台内容秩序与安全的权利。

5. 责任限制
5.1 平台将尽力保障服务连续性，但不对不可抗力导致的中断承担责任。
5.2 因您违规使用造成损失的，平台有权采取限制、封禁等措施。

6. 协议更新
6.1 平台可根据业务发展更新本协议。
6.2 继续使用服务即视为您接受更新后的协议。

如您对本协议有疑问，可通过“关于我们”中的联系方式与我们联系。`,X=`遇见App非常重视您的个人信息与隐私保护。本政策将说明我们如何收集、使用、存储和保护您的信息。

1. 我们收集的信息
1.1 您注册/登录时提供的信息：手机号、登录凭证等。
1.2 您使用服务时产生的信息：聊天记录、设备标识、登录日志等。
1.3 为保障服务安全，我们可能收集必要的风控信息。

2. 信息使用目的
2.1 提供账号登录、聊天互动等核心功能。
2.2 进行身份验证、安全风控、异常排查。
2.3 改善产品体验与服务质量。

3. 信息共享与披露
3.1 未经您同意，我们不会向无关第三方出售您的个人信息。
3.2 在法律法规要求或监管机关依法要求下，我们可能依法披露。

4. 信息存储与保护
4.1 我们采取合理可行的安全措施保护您的信息。
4.2 我们仅在实现服务目的所需期限内保留您的个人信息。

5. 您的权利
5.1 您有权查询、更正、删除个人信息。
5.2 您可通过注销账号等方式终止服务。

6. 未成年人保护
6.1 若您为未成年人，请在监护人指导下使用本平台服务。

7. 政策更新
7.1 我们可能适时更新本政策，更新后将通过适当方式提示。

如您对隐私政策有疑问，可通过“关于我们”中的联系方式与我们联系。`,Y=`遇见 App 是一款以真实、温暖、陪伴为核心理念的社交应用。

我们希望帮助每一位用户，在忙碌生活中更高效地遇见志同道合的人，建立真诚、平等、舒适的连接。

【我们的愿景】
让每一次相遇都更真实，让每一次聊天都更有价值。

【我们在做什么】
1. 提供安全、稳定、流畅的聊天与互动体验；
2. 通过风控与内容治理，持续维护友善社区氛围；
3. 持续优化产品细节，提升匹配效率与沟通质量。

【我们的价值观】
真实：反对虚假人设与欺骗行为；
尊重：倡导边界感与彼此尊重；
安全：保护用户信息与交流环境；
长期：坚持做对用户长期有价值的产品。

【联系我们】
客服邮箱：support@yujianapp.com
工作时间：周一至周日 09:00-21:00

感谢你使用遇见 App，祝你在这里遇见更好的关系与体验。`,Z=A({name:"MySettings",__name:"settings",setup(ss){const u=x(),d=c(""),l=c(!1),p=c("user"),r=c(!1),f=b(()=>p.value==="user"?"《遇见App用户协议》":"《遇见App隐私政策》"),m=n=>{p.value=n,l.value=!0},_=b(()=>p.value==="user"?W:X);(async()=>{const n=await P();d.value=(n==null?void 0:n.mobile)||""})();const k=()=>{w("已清除图片缓存")},C=()=>{N({title:"退出登录",message:"确定退出当前账号吗？",showCancelButton:!0,cancelButtonText:"取消",confirmButtonText:"确认"}).then(async()=>{await V({deviceId:localStorage.getItem("c_device_id")||"default_device"}),localStorage.removeItem("c_access_token"),localStorage.removeItem("c_refresh_token"),localStorage.removeItem("c_user_info"),w("已退出"),u.replace({name:"Login"})}).catch(()=>{})};return(n,s)=>{const a=$,v=h;return I(),B("div",j,[e("div",D,[e("div",L,[e("div",E,[e("div",G,[s[9]||(s[9]=e("span",{class:"label"},"手机号码",-1)),e("span",M,[S(i(d.value||"-")+" ",1),s[8]||(s[8]=e("span",{class:"text-xs opacity-50 ml-1"},"(仅自己可见)",-1))])]),e("div",{class:"cell clickable",onClick:s[0]||(s[0]=o=>T(u).push({name:"ChangePassword"}))},[s[10]||(s[10]=e("span",{class:"label"},"修改密码",-1)),t(a,{name:"arrow",class:"arrow-icon"})])]),e("div",R,[e("div",{class:"cell clickable",onClick:k},[s[11]||(s[11]=e("span",{class:"label"},"清除图片缓存",-1)),t(a,{name:"arrow",class:"arrow-icon"})])]),e("div",q,[e("div",{class:"cell clickable",onClick:s[1]||(s[1]=o=>r.value=!0)},[s[12]||(s[12]=e("span",{class:"label"},"关于我们",-1)),t(a,{name:"arrow",class:"arrow-icon"})]),e("div",{class:"cell clickable",onClick:s[2]||(s[2]=o=>m("user"))},[s[13]||(s[13]=e("span",{class:"label"},"用户协议",-1)),t(a,{name:"arrow",class:"arrow-icon"})]),e("div",{class:"cell clickable",onClick:s[3]||(s[3]=o=>m("privacy"))},[s[14]||(s[14]=e("span",{class:"label"},"隐私政策",-1)),t(a,{name:"arrow",class:"arrow-icon"})]),s[15]||(s[15]=e("div",{class:"cell"},[e("span",{class:"label"},"当前版本"),e("span",{class:"value"},"1.0.0.1")],-1))]),e("button",{class:"logout-btn",onClick:C},"退出登录")])]),t(v,{show:r.value,"onUpdate:show":s[5]||(s[5]=o=>r.value=o),position:"bottom",round:"",style:{height:"72vh",background:"#0b0b0b"}},{default:g(()=>[e("div",F,[e("div",H,[s[16]||(s[16]=e("span",{class:"agreement-title"},"关于遇见 App",-1)),t(a,{name:"cross",size:"20",class:"close-icon",onClick:s[4]||(s[4]=o=>r.value=!1)})]),s[17]||(s[17]=e("div",{class:"agreement-sub"},"让每一次相遇都更真实",-1)),e("div",{class:"agreement-body"},[e("pre",null,i(Y))])])]),_:1},8,["show"]),t(v,{show:l.value,"onUpdate:show":s[7]||(s[7]=o=>l.value=o),position:"bottom",round:"",style:{height:"78vh",background:"#0b0b0b"}},{default:g(()=>[e("div",J,[e("div",K,[e("span",O,i(f.value),1),t(a,{name:"cross",size:"20",class:"close-icon",onClick:s[6]||(s[6]=o=>l.value=!1)})]),s[18]||(s[18]=e("div",{class:"agreement-sub"},"更新日期：2026-03-27",-1)),e("div",Q,[e("pre",null,i(_.value),1)])])]),_:1},8,["show"])])}}}),rs=U(Z,[["__scopeId","data-v-ee050c97"]]);export{rs as default};

import{P as a,g as s}from"./index-sx4jVXq_.js";class d extends a{constructor(e,t){super(e,t,{pageTitle:"Error",pageId:"error-page",autoInit:!1}),this.error={code:"404",message:"Page Not Found",details:"The page you are looking for does not exist."};const r=t.getRouteContext();if(r.failed()){const o=r.failure();o&&(this.error={code:o.code||"404",message:o.message||"Page Not Found",details:o.details||"The page you are looking for does not exist."})}}setParams(e){this.error={...this.error,...e}}async onInit(){try{document.readyState==="loading"&&await new Promise(e=>{document.addEventListener("DOMContentLoaded",e)}),document.title=`${this.error.code} - ${this.error.message} - Opinion`,await this.loadMainContent(),await new Promise(e=>setTimeout(e,0))}catch(e){throw console.error("❌ ErrorPage - Initialization failed:",e),e}}async loadMainContent(){const e=this.mainContent.getElement();e&&(e.innerHTML=`
      <div class="error-page">
        <div class="error-container">
          <h1 class="error-code">${this.error.code}</h1>
          <h2 class="error-message">${this.error.message}</h2>
          <p class="error-details">${this.error.details}</p>
          <div class="error-actions">
            <a href="${s("/")}" class="button-primary">Go to Homepage</a>
            <button onclick="window.history.back()" class="button-secondary">Go Back</button>
          </div>
        </div>
      </div>
    `)}setupEventListeners(){this.setupEventDelegation();const e=this.mainContent.getElement();e&&this.addEventListener(e,"click",t=>{t.target.matches(".button-secondary")&&(t.preventDefault(),window.history.back())})}onDestroy(){}}export{d as default};
//# sourceMappingURL=ErrorPage-Dd6G63Yx.js.map

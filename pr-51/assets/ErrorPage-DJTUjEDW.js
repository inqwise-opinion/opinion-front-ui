import{P as a,g as s}from"./index-DxVuskio.js";class d extends a{constructor(e,t){super(e,t,{pageTitle:"Error",pageId:"error-page"}),this.error={code:"404",message:"Page Not Found",details:"The page you are looking for does not exist."};const o=t.getRouteContext();if(o.failed()){const r=o.failure();r&&(this.error={code:r.code||"404",message:r.message||"Page Not Found",details:r.details||"The page you are looking for does not exist."})}}setParams(e){this.error={...this.error,...e}}async onInit(){try{document.readyState==="loading"&&await new Promise(e=>{document.addEventListener("DOMContentLoaded",e)}),document.title=`${this.error.code} - ${this.error.message} - Opinion`,await this.loadMainContent(),await new Promise(e=>setTimeout(e,0))}catch(e){throw this.logger.error("❌ ErrorPage - Initialization failed:",e),e}}async loadMainContent(){const e=this.mainContent.getElement();e&&(e.innerHTML=`
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
//# sourceMappingURL=ErrorPage-DJTUjEDW.js.map

import"./LoggerFactory-oeMHe3OB.js";import{r as e,t}from"./index-CF3krCOY.js";var n=class extends t{constructor(e,t){super(e,t,{pageTitle:`Error`,pageId:`error-page`}),this.error={code:`404`,message:`Page Not Found`,details:`The page you are looking for does not exist.`};let n=t.getRouteContext();if(n.failed()){let e=n.failure();e&&(this.error={code:e.code||`404`,message:e.message||`Page Not Found`,details:e.details||`The page you are looking for does not exist.`})}}setParams(e){this.error={...this.error,...e}}async onInit(){try{document.readyState===`loading`&&await new Promise(e=>{document.addEventListener(`DOMContentLoaded`,e)}),document.title=`${this.error.code} - ${this.error.message} - Opinion`,await this.loadMainContent(),await new Promise(e=>setTimeout(e,0))}catch(e){throw this.logger.error(`❌ ErrorPage - Initialization failed:`,e),e}}async loadMainContent(){let t=this.mainContent.getElement();t&&(t.innerHTML=`
      <div class="error-page">
        <div class="error-container">
          <h1 class="error-code">${this.error.code}</h1>
          <h2 class="error-message">${this.error.message}</h2>
          <p class="error-details">${this.error.details}</p>
          <div class="error-actions">
            <a href="${e(`/`)}" class="button-primary">Go to Homepage</a>
            <button onclick="window.history.back()" class="button-secondary">Go Back</button>
          </div>
        </div>
      </div>
    `)}setupEventListeners(){this.setupEventDelegation();let e=this.mainContent.getElement();e&&this.addEventListener(e,`click`,e=>{e.target.matches(`.button-secondary`)&&(e.preventDefault(),window.history.back())})}onDestroy(){}};export{n as default};
//# sourceMappingURL=ErrorPage-CrRAl42H.js.map
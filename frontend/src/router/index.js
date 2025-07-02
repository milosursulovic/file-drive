import { createRouter, createWebHistory } from "vue-router";
import LoginView from "@/views/LoginView.vue";
import DashboardView from "@/views/DashboardView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import SearchByIpView from "@/views/SearchByIpView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/login", component: LoginView },
    {
      path: "/dashboard",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/search-by-ip",
      component: SearchByIpView,
      meta: { requiresAuth: true },
    },
    { path: "/", redirect: "/dashboard" },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundView,
    },
  ],
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) {
    next("/login");
  } else {
    next();
  }
});

export default router;

import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
  },
  {
    path: "/annotation",
    name: "Annotation",
    component: () => import("@/components/ScreenAnnotation.vue"),
  },
  {
    path: "/whiteboard",
    name: "Whiteboard",
    component: () => import("@/components/Whiteboard.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
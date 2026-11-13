import { Link, Navigate } from "react-router";
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  Mail,
  Sprout,
  Users,
} from "lucide-react";
import { ADMIN_HEADING_FONT, type AdminTab } from "./constants";
import { useAdminDashboard } from "./useAdminDashboard";
import { AdminUsersTab } from "./AdminUsersTab";
import { AdminCropsTab } from "./AdminCropsTab";
import { AdminPostsTab } from "./AdminPostsTab";
import { AdminMessagesTab } from "./AdminMessagesTab";
import { Reveal } from "../../components/animations/Reveal";
import { PageLabel } from "../../components/PageLabel";

export function AdminDashboard() {
  const admin = useAdminDashboard();

  if (!admin.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (!admin.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const { t, language, tab, setTab } = admin;

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: "users", label: t("adminNavUsers"), icon: Users },
    { id: "crops", label: t("adminNavCrops"), icon: Sprout },
    { id: "posts", label: t("adminNavPosts"), icon: FileText },
    {
      id: "messages",
      label: language === "ar" ? "الرسائل" : "Messages",
      icon: Mail,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        <Reveal variant="slide" delayMs={0}>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("adminBackHome")}
          </Link>
        </Reveal>

        <Reveal variant="zoom" delayMs={60}>
        <header className="mb-8 sm:mb-10">
          <PageLabel icon={LayoutDashboard} className="text-xs sm:text-sm mb-3 sm:mb-4">
            {t("adminDashboard")}
          </PageLabel>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 sm:mb-3 break-words"
            style={{ fontFamily: ADMIN_HEADING_FONT }}
          >
            {t("adminDashboard")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl">
            {t("adminDemoNote")}
          </p>
        </header>
        </Reveal>

        <Reveal variant="pop" delayMs={120}>
        <div className="grid grid-cols-2 gap-2 mb-8 sm:flex sm:flex-wrap sm:gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 sm:px-5 sm:w-auto rounded-full text-xs sm:text-sm font-semibold transition-all ${
                tab === id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card border border-border text-foreground/80 hover:border-primary/40"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
        </Reveal>

        <Reveal key={tab} variant="rise" delayMs={40}>
        {tab === "users" ? (
          <AdminUsersTab
            language={language}
            t={t}
            usersSearch={admin.usersSearch}
            setUsersSearch={admin.setUsersSearch}
            loadingUsers={admin.loadingUsers}
            apiUsers={admin.apiUsers}
            filteredAdminUsers={admin.filteredAdminUsers}
            submitting={admin.submitting}
            onDeleteUser={(u) => void admin.handleDeleteUser(u)}
          />
        ) : null}

        {tab === "crops" ? (
          <AdminCropsTab
            language={language}
            t={t}
            cropsSearch={admin.cropsSearch}
            setCropsSearch={admin.setCropsSearch}
            loadingCrops={admin.loadingCrops}
            apiCrops={admin.apiCrops}
            filteredAdminCrops={admin.filteredAdminCrops}
            submitting={admin.submitting}
            onDeleteCrop={(row) => void admin.handleDeleteCrop(row)}
            seasonLabel={admin.seasonLabel}
            cropForm={admin.cropForm}
            setCropForm={admin.setCropForm}
            onSubmitCrop={(e) => void admin.handleAddCrop(e)}
            onCropImageFile={admin.handleCropImageFile}
          />
        ) : null}

        {tab === "posts" ? (
          <AdminPostsTab
            language={language}
            t={t}
            postsSearch={admin.postsSearch}
            setPostsSearch={admin.setPostsSearch}
            loadingPosts={admin.loadingPosts}
            posts={admin.posts}
            filteredAdminPosts={admin.filteredAdminPosts}
            submitting={admin.submitting}
            onDeletePost={(id) => void admin.handleDeletePost(id)}
          />
        ) : null}

        {tab === "messages" ? (
          <AdminMessagesTab
            language={language}
            messageQuery={admin.messageQuery}
            setMessageQuery={admin.setMessageQuery}
            messagesError={admin.messagesError}
            loadingMessages={admin.loadingMessages}
            messages={admin.messages}
            messageFilter={admin.messageFilter}
            setMessageFilter={admin.setMessageFilter}
            filteredMessages={admin.filteredMessages}
            selectedMessageId={admin.selectedMessageId}
            selectedMessage={admin.selectedMessage}
            loadingSelectedMessage={admin.loadingSelectedMessage}
            replyDraft={admin.replyDraft}
            setReplyDraft={admin.setReplyDraft}
            setReplyDraftByMessageId={admin.setReplyDraftByMessageId}
            replySending={admin.replySending}
            replyNotice={admin.replyNotice}
            submitting={admin.submitting}
            onSelectMessage={(id) => void admin.handleSelectMessage(id)}
            onDeleteMessage={(id) => void admin.handleDeleteMessage(id)}
            onReply={() => void admin.handleReply()}
            formatDateTime={admin.formatDateTime}
          />
        ) : null}
        </Reveal>
      </div>
    </div>
  );
}

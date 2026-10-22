import React, { useState } from 'react';
import { Modal, Button, Row, Col, Input, Divider, Tooltip, message, Spin, Card, Space, Tag } from 'antd';
import { MessageCircle as WhatsAppOutlined, Mail as MailOutlined, Copy as CopyOutlined, QrCode as QrcodeOutlined, Share2 as ShareAltOutlined, Link as LinkOutlined, Download as DownloadOutlined, CircleCheck as CheckCircleOutlined } from 'lucide-react';
import { Typography } from 'antd';
import '../assets/styles/legacy/common.css';
import '../assets/styles/legacy/share-modal.css';

const { Text, Title } = Typography;

// Share Modal Component
const ShareModal = ({
  visible,
  loading,
  link,
  title,
  resumeName,
  onCancel,
  shareDescription = 'Share this screening questionnaire link with candidates',
  scanDescription = 'Scan QR code to open the form',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);

  // Generate QR code when link is available
  React.useEffect(() => {
    if (link && !qrCodeUrl) {
      // Using QR Server API to generate QR code
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
      setQrCodeUrl(qrUrl);
    }
  }, [link, qrCodeUrl]);

  const shareOptions = [
    {
      key: 'whatsapp',
      icon: <WhatsAppOutlined size="1em" className={["app-icon", "share-modal__option-icon-glyph"].filter(Boolean).join(' ')} />,
      label: 'WhatsApp',
      action: () => {
        const text = `Screening Questionnaire: ${title}\n\nLink: ${link}\n\nPlease fill out this questionnaire.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    },
    {
      key: 'email',
      icon: <MailOutlined size="1em" className={["app-icon", "share-modal__option-icon-glyph"].filter(Boolean).join(' ')} />,
      label: 'Email',
      action: () => {
        const subject = `Screening Questionnaire: ${title}`;
        const body = `Please fill out the screening questionnaire:\n\n${link}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      }
    },
    {
      key: 'copy',
      icon: <CopyOutlined size="1em" className={["app-icon", "share-modal__option-icon-glyph"].filter(Boolean).join(' ')} />,
      label: 'Copy Link',
      action: () => {
        navigator.clipboard.writeText(link);
        message.success('Link copied!');
      }
    }
  ];

  const downloadQRCode = async () => {
    if (qrCodeUrl) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `screening-form-qr-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        message.success('QR Code downloaded!');
      } catch (error) {
        message.error('Failed to download QR code');
      }
    }
  };

  const copyQRCodeImage = async () => {
    if (qrCodeUrl) {
      try {
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        message.success('QR Code image copied to clipboard!');
      } catch (error) {
        message.error('Failed to copy QR code image');
      }
    }
  };

  if (loading) {
    return (
      <Modal
        title={
          <div className="flex-row gap-8">
            <ShareAltOutlined size="1em" className={["app-icon", "share-modal__loading-title-icon"].filter(Boolean).join(' ')} />
            Generating Screening Link
          </div>
        }
        open={visible}
        onCancel={onCancel}
        footer={null}
        centered
        width={450}
        bodyStyle={{ padding: '32px 24px' }}
      >
        <div className="share-modal__loading-body">
          <div className="share-modal__loading-icon-circle">
            <Spin size="large" className="share-modal__loading-spin" />
          </div>
          <Title level={4} className="share-modal__loading-heading">
            Creating Your Share Link
          </Title>
          <Text className="share-modal__loading-subtext">
            Please wait while we generate your screening questionnaire link...
          </Text>
          <div className="share-modal__loading-bar-track">
            <div className="share-modal__loading-bar-fill" />
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Share Screening Questionnaire"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel} type="text">
          Close
        </Button>
      ]}
      centered
      width={500}
      bodyStyle={{ padding: '20px' }}
    >
      <div>
        {/* Title Section */}
        <div className="share-modal__title-section">
          <Title level={4} className="share-modal__title-heading">
            {title}
          </Title>
          {resumeName && (
            <Text className="share-modal__cv-name-text">
              <strong>CV Name:</strong> {resumeName}
            </Text>
          )}
          {link && (
            <div className="share-modal__link-wrap">
              <Text className="share-modal__link-label">
                Link:
              </Text>
              <Input
                value={link}
                readOnly
                className="share-modal__link-input"
                onClick={(e) => e.target.select()}
              />
            </div>
          )}
          <Text className="share-modal__description-text">
            {shareDescription}
          </Text>
        </div>

        {/* QR Code Section */}
        <div className="share-modal__qr-section">
          <Card
            size="small"
            className="share-modal__qr-card"
          >
            <div className="share-modal__qr-card-body">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="share-modal__qr-image"
                />
              ) : (
                <div className="share-modal__qr-placeholder">
                  <QrcodeOutlined size="1em" className={["app-icon", "share-modal__qr-placeholder-icon"].filter(Boolean).join(' ')} />
                </div>
              )}
            </div>
          </Card>

          <div className="share-modal__qr-actions">
            <Text className="share-modal__qr-actions-label">
              {scanDescription}
            </Text>
            {qrCodeUrl && (
              <Space size="small">
                <Button
                  type="default"
                  size="small"
                  icon={<DownloadOutlined size="1em" className="app-icon" />}
                  onClick={downloadQRCode}
                  className="share-modal__qr-action-btn"
                >
                  Download QR
                </Button>
                <Button
                  type="default"
                  size="small"
                  icon={<CopyOutlined size="1em" className="app-icon" />}
                  onClick={copyQRCodeImage}
                  className="share-modal__qr-action-btn"
                >
                  Copy Image
                </Button>
              </Space>
            )}
          </div>
        </div>

        <Divider className="share-modal__divider" />

        {/* Share Options */}
        <div>
          <div className="share-modal__options-header">
            <Title level={5} className="share-modal__options-heading">
              Share Options
            </Title>
            <Text className="share-modal__options-subtext">
              Choose how you want to share this form
            </Text>
          </div>

          <Row gutter={[12, 12]} justify="center">
            {shareOptions.map(option => (
              <Col key={option.key} xs={8} sm={8} md={8}>
                <div
                  className="share-modal__option-tile"
                  onClick={option.action}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.background = '#f0f8ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  <div className="share-modal__option-icon">
                    {option.icon}
                  </div>
                  <div className="share-modal__option-label">
                    {option.label}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Footer Note */}
        <div className="share-modal__footer-note">
          <Text className="share-modal__footer-note-text">
            This link is unique and tracks responses automatically
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
